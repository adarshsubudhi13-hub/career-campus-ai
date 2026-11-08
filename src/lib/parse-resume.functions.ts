import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_BASE64_CHARS,
  MAX_TEXT_CHARS,
  SUPPORTED_FORMATS_LABEL,
} from "@/lib/resume-file-rules";


const Input = z
  .object({
    kind: z.enum(["pdf", "image", "text"]),
    // base64 (no data: prefix) for pdf/image; raw text for text
    data: z.string().min(1).max(MAX_BASE64_CHARS),
    mimeType: z.string().optional(),
    filename: z.string().max(255).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "text") {
      if (v.data.length > MAX_TEXT_CHARS) {
        ctx.addIssue({ code: "custom", message: "Extracted resume text is too large." });
      }
      return;
    }
    const mime = (v.mimeType || "").toLowerCase().split(";")[0].trim();
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mime)) {
      ctx.addIssue({
        code: "custom",
        message: `Unsupported file type. Only ${SUPPORTED_FORMATS_LABEL} files are accepted.`,
      });
      return;
    }
    if (v.kind === "pdf" && mime !== "application/pdf") {
      ctx.addIssue({ code: "custom", message: "PDF payload must have an application/pdf content type." });
    }
    if (v.kind === "image" && !mime.startsWith("image/")) {
      ctx.addIssue({ code: "custom", message: "Image payload must have an image content type." });
    }
    // Reject payloads whose decoded size exceeds the upload limit.
    const approxBytes = Math.floor((v.data.length * 3) / 4);
    if (approxBytes > (MAX_BASE64_CHARS * 3) / 4) {
      ctx.addIssue({ code: "custom", message: "File is too large." });
    }
  });


const PROFILE_SCHEMA_PROMPT = `You are an expert resume parser. Extract the candidate's profile from the resume content and return STRICT JSON matching exactly this schema (no markdown, no commentary):

{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "headline": string,
  "summary": string,
  "education": [{ "degree": string, "institution": string, "year": string, "gpa": string }],
  "skills": string[],
  "projects": [{ "name": string, "description": string, "tech": string[] }],
  "experience": [{ "role": string, "company": string, "duration": string, "highlights": string[] }],
  "certifications": string[],
  "achievements": string[],
  "languages": string[]
}

Use empty string "" for missing scalar fields and [] for missing arrays. Do NOT invent facts. Skills must be normalized (e.g. "React.js" -> "React"). Return only the JSON object.`;

export const parseResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))

  .handler(async ({ data }) => {
    const reqId = Math.random().toString(36).slice(2, 8);
    const t0 = Date.now();
    const log = (msg: string, extra?: Record<string, unknown>) =>
      console.log(`[parseResume:${reqId}] +${Date.now() - t0}ms ${msg}`, extra ?? "");

    log("handler:start", {
      kind: data.kind,
      dataLen: data.data.length,
      mimeType: data.mimeType,
      filename: data.filename,
    });

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      log("handler:error missing LOVABLE_API_KEY");
      throw new Error("AI service is not configured.");
    }

    let content: any;
    if (data.kind === "text") {
      content = [
        { type: "text", text: PROFILE_SCHEMA_PROMPT },
        { type: "text", text: `Resume text:\n\n${data.data.slice(0, 200_000)}` },
      ];
    } else if (data.kind === "pdf") {
      const mime = data.mimeType || "application/pdf";
      content = [
        { type: "text", text: PROFILE_SCHEMA_PROMPT },
        {
          type: "file",
          file: {
            filename: data.filename || "resume.pdf",
            file_data: `data:${mime};base64,${data.data}`,
          },
        },
      ];
    } else {
      const mime = data.mimeType || "image/png";
      content = [
        { type: "text", text: PROFILE_SCHEMA_PROMPT },
        { type: "image_url", image_url: { url: `data:${mime};base64,${data.data}` } },
      ];
    }

    log("gateway:fetch:start");
    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content }],
          response_format: { type: "json_object" },
        }),
      });
    } catch (e: any) {
      log("gateway:fetch:threw", {
        name: e?.name,
        message: e?.message,
      });
      throw e;
    }
    log("gateway:fetch:response", { status: res.status, ok: res.ok });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log("gateway:fetch:error-body", { status: res.status, body: text.slice(0, 300) });
      if (res.status === 429) {
        throw new Error("Rate limit reached. Please retry shortly.");
      }
      if (res.status === 402) {
        throw new Error("AI credits exhausted. Add credits in workspace settings.");
      }
      throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: any = {};
    try {
      // Strip code fences if any
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response. Try a clearer resume file.");
    }

    type Education = { degree: string; institution: string; year: string; gpa: string };
    type Project = { name: string; description: string; tech: string[] };
    type Experience = { role: string; company: string; duration: string; highlights: string[] };

    return {
      name: String(parsed.name ?? ""),
      email: String(parsed.email ?? ""),
      phone: String(parsed.phone ?? ""),
      location: String(parsed.location ?? ""),
      headline: String(parsed.headline ?? ""),
      summary: String(parsed.summary ?? ""),
      education: (Array.isArray(parsed.education) ? parsed.education : []) as Education[],
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
      projects: (Array.isArray(parsed.projects) ? parsed.projects : []) as Project[],
      experience: (Array.isArray(parsed.experience) ? parsed.experience : []) as Experience[],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications.map(String) : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.map(String) : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages.map(String) : [],
    };
  });

export type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  education: { degree: string; institution: string; year: string; gpa: string }[];
  skills: string[];
  projects: { name: string; description: string; tech: string[] }[];
  experience: { role: string; company: string; duration: string; highlights: string[] }[];
  certifications: string[];
  achievements: string[];
  languages: string[];
};
