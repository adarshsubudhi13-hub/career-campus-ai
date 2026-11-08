import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ---------------- shared shapes ---------------- */

export type ImportedProject = {
  name: string;
  description: string;
  tech: string[];
  url?: string;
};

export type ImportResult = {
  source: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  skills: string[];
  projects: ImportedProject[];
  notes: string[];
};

const HandleInput = z.object({
  handle: z
    .string()
    .trim()
    .min(1, "Enter a username.")
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, "Usernames can only contain letters, numbers, dots, dashes and underscores."),
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function callLovableAi(prompt: string, text: string): Promise<any> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI service is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "user", content: [{ type: "text", text: prompt }, { type: "text", text }] },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, ""));
  } catch {
    throw new Error("Could not read the AI response. Try again.");
  }
}

const EXTRACT_PROMPT = `Extract a candidate profile from the content below. Return STRICT JSON only:
{"headline": string, "summary": string, "skills": string[], "projects": [{"name": string, "description": string, "tech": string[], "url": string}]}
Use "" for missing scalars and [] for missing arrays. Never invent facts. Normalize skills (e.g. "React.js" -> "React").`;

/* ---------------- GitHub ---------------- */

export const importGithub = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => HandleInput.parse(input))
  .handler(async ({ data }): Promise<ImportResult> => {
    const headers = { accept: "application/vnd.github+json", "user-agent": "lumen-app" };
    const [userRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(data.handle)}`, { headers }),
      fetch(
        `https://api.github.com/users/${encodeURIComponent(data.handle)}/repos?per_page=100&sort=updated`,
        { headers },
      ),
    ]);
    if (userRes.status === 404) throw new Error(`No GitHub user called "${data.handle}".`);
    if (!userRes.ok) throw new Error(`GitHub returned ${userRes.status}. Try again shortly.`);
    if (!repoRes.ok) throw new Error(`GitHub returned ${repoRes.status} while reading repositories.`);

    const user: any = await userRes.json();
    const repos: any[] = await repoRes.json();
    const owned = repos.filter((r) => !r.fork);
    const langCount = new Map<string, number>();
    const topics = new Set<string>();
    for (const r of owned) {
      if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
      for (const t of r.topics ?? []) topics.add(String(t));
    }
    const stars = owned.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    const projects: ImportedProject[] = owned
      .slice()
      .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
      .slice(0, 8)
      .map((r) => ({
        name: r.name,
        description: r.description ?? "",
        tech: [r.language, ...(r.topics ?? [])].filter(Boolean).slice(0, 6),
        url: r.html_url,
      }));

    return {
      source: "github",
      title: user.name || user.login,
      subtitle: user.bio || `github.com/${user.login}`,
      stats: [
        { label: "Public repos", value: String(user.public_repos ?? owned.length) },
        { label: "Stars earned", value: String(stars) },
        { label: "Followers", value: String(user.followers ?? 0) },
      ],
      skills: [
        ...[...langCount.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l),
        ...[...topics].slice(0, 12),
      ].slice(0, 20),
      projects,
      notes: owned.length === 0 ? ["This account has no public, non-forked repositories."] : [],
    };
  });

/* ---------------- Coding profiles ---------------- */

const CodingInput = z.object({
  platform: z.enum(["leetcode", "codeforces"]),
  handle: HandleInput.shape.handle,
});

export const importCodingProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CodingInput.parse(input))
  .handler(async ({ data }): Promise<ImportResult> => {
    if (data.platform === "codeforces") {
      const res = await fetch(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(data.handle)}`,
      );
      const json: any = await res.json().catch(() => null);
      if (!json || json.status !== "OK" || !json.result?.[0]) {
        throw new Error(`Codeforces has no handle "${data.handle}".`);
      }
      const u = json.result[0];
      let solved = 0;
      try {
        const subRes = await fetch(
          `https://codeforces.com/api/user.status?handle=${encodeURIComponent(data.handle)}&from=1&count=2000`,
        );
        const subs: any = await subRes.json();
        if (subs?.status === "OK") {
          const ok = new Set<string>();
          for (const s of subs.result) {
            if (s.verdict === "OK" && s.problem) ok.add(`${s.problem.contestId}-${s.problem.index}`);
          }
          solved = ok.size;
        }
      } catch {
        /* rating is enough */
      }
      return {
        source: "codeforces",
        title: u.handle,
        subtitle: [u.rank, u.organization].filter(Boolean).join(" · ") || "Codeforces profile",
        stats: [
          { label: "Rating", value: String(u.rating ?? "unrated") },
          { label: "Max rating", value: String(u.maxRating ?? "—") },
          { label: "Problems solved", value: solved ? String(solved) : "—" },
        ],
        skills: ["Data structures", "Algorithms", "Competitive programming", "C++/Problem solving"],
        projects: [],
        notes: [],
      };
    }

    // LeetCode public GraphQL
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "content-type": "application/json", referer: "https://leetcode.com" },
      body: JSON.stringify({
        query: `query u($username: String!) {
          matchedUser(username: $username) {
            username
            profile { realName ranking reputation aboutMe skillTags }
            submitStatsGlobal { acSubmissionNum { difficulty count } }
          }
        }`,
        variables: { username: data.handle },
      }),
    });
    if (!res.ok) throw new Error(`LeetCode returned ${res.status}. Try again shortly.`);
    const json: any = await res.json().catch(() => null);
    const u = json?.data?.matchedUser;
    if (!u) throw new Error(`LeetCode has no user "${data.handle}".`);
    const counts: Record<string, number> = {};
    for (const row of u.submitStatsGlobal?.acSubmissionNum ?? []) counts[row.difficulty] = row.count;
    return {
      source: "leetcode",
      title: u.profile?.realName || u.username,
      subtitle: u.profile?.aboutMe || `leetcode.com/${u.username}`,
      stats: [
        { label: "Solved", value: String(counts["All"] ?? 0) },
        { label: "Medium + Hard", value: String((counts["Medium"] ?? 0) + (counts["Hard"] ?? 0)) },
        { label: "Ranking", value: u.profile?.ranking ? `#${u.profile.ranking}` : "—" },
      ],
      skills: (u.profile?.skillTags ?? []).slice(0, 20),
      projects: [],
      notes: [],
    };
  });

/* ---------------- Portfolio website (AI) ---------------- */

const UrlInput = z.object({
  url: z
    .string()
    .trim()
    .min(4)
    .max(300)
    .refine((v) => {
      try {
        const u = new URL(v.startsWith("http") ? v : `https://${v}`);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, "Enter a valid website URL."),
});

export const importPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UrlInput.parse(input))
  .handler(async ({ data }): Promise<ImportResult> => {
    const target = new URL(data.url.startsWith("http") ? data.url : `https://${data.url}`);
    if (!/^https?:$/.test(target.protocol)) throw new Error("Only http(s) websites can be imported.");
    let html: string;
    try {
      const res = await fetch(target.toString(), {
        headers: { "user-agent": "Mozilla/5.0 (compatible; LumenBot/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`The site responded with ${res.status}.`);
      html = await res.text();
    } catch (e: any) {
      throw new Error(`Could not fetch that site: ${e?.message ?? "network error"}`);
    }
    const text = stripHtml(html).slice(0, 20_000);
    if (text.length < 80) throw new Error("That page had almost no readable text (it may be JS-only).");

    const parsed = await callLovableAi(EXTRACT_PROMPT, `Website: ${target.hostname}\n\n${text}`);
    return {
      source: "portfolio",
      title: parsed.headline || target.hostname,
      subtitle: parsed.summary || target.toString(),
      stats: [
        { label: "Skills found", value: String((parsed.skills ?? []).length) },
        { label: "Projects found", value: String((parsed.projects ?? []).length) },
      ],
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 30) : [],
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.slice(0, 10).map((p: any) => ({
            name: String(p.name ?? ""),
            description: String(p.description ?? ""),
            tech: Array.isArray(p.tech) ? p.tech.map(String) : [],
            url: p.url ? String(p.url) : undefined,
          }))
        : [],
      notes: [],
    };
  });

/* ---------------- LinkedIn (pasted profile text, AI) ---------------- */

const TextInput = z.object({
  text: z.string().trim().min(120, "Paste a bit more of your profile so we can parse it.").max(60_000),
});

export const importLinkedinText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TextInput.parse(input))
  .handler(async ({ data }): Promise<ImportResult> => {
    const parsed = await callLovableAi(EXTRACT_PROMPT, `LinkedIn profile text:\n\n${data.text}`);
    return {
      source: "linkedin",
      title: parsed.headline || "LinkedIn profile",
      subtitle: parsed.summary || "Parsed from pasted profile text",
      stats: [
        { label: "Skills found", value: String((parsed.skills ?? []).length) },
        { label: "Projects found", value: String((parsed.projects ?? []).length) },
      ],
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 30) : [],
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.slice(0, 10).map((p: any) => ({
            name: String(p.name ?? ""),
            description: String(p.description ?? ""),
            tech: Array.isArray(p.tech) ? p.tech.map(String) : [],
            url: p.url ? String(p.url) : undefined,
          }))
        : [],
      notes: ["LinkedIn has no public profile API, so we parse the text you paste in."],
    };
  });
