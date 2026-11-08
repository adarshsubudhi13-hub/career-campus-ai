// Single source of truth for resume upload validation (client + server).

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB hard limit
export const MIN_UPLOAD_BYTES = 512; // reject empty / truncated files
// base64 inflates by ~4/3; allow a little headroom for the encoded payload.
export const MAX_BASE64_CHARS = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 1024;
export const MAX_TEXT_CHARS = 200_000;

export type ResumeKind = "pdf" | "image" | "docx";

type Rule = {
  kind: ResumeKind;
  extensions: string[];
  mimeTypes: string[];
  maxBytes: number;
};

export const RESUME_RULES: Rule[] = [
  {
    kind: "pdf",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    maxBytes: MAX_UPLOAD_BYTES,
  },
  {
    kind: "docx",
    extensions: [".docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxBytes: 5 * 1024 * 1024,
  },
  {
    kind: "image",
    extensions: [".png", ".jpg", ".jpeg", ".webp"],
    mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 8 * 1024 * 1024,
  },
];

export const ACCEPT_ATTRIBUTE = RESUME_RULES.flatMap((r) => [
  ...r.extensions,
  ...r.mimeTypes,
]).join(",");

export const ALLOWED_UPLOAD_MIME_TYPES = RESUME_RULES.flatMap((r) => r.mimeTypes);

export const SUPPORTED_FORMATS_LABEL = "PDF, DOCX, PNG, JPG, or WEBP";

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function formatMb(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export type ValidationResult =
  | { ok: true; kind: ResumeKind; mimeType: string }
  | { ok: false; reason: string };

/** Strict allowlist check: extension AND (when present) MIME type must match the same rule. */
export function validateResumeFile(file: {
  name: string;
  type: string;
  size: number;
}): ValidationResult {
  const ext = extensionOf(file.name);
  const rule = RESUME_RULES.find((r) => r.extensions.includes(ext));

  if (!rule) {
    return {
      ok: false,
      reason: `Unsupported file type${ext ? ` "${ext}"` : ""}. Only ${SUPPORTED_FORMATS_LABEL} files are accepted.`,
    };
  }

  const declared = (file.type || "").toLowerCase().split(";")[0].trim();
  if (declared && !rule.mimeTypes.includes(declared)) {
    return {
      ok: false,
      reason: `The file content type (${declared}) does not match its "${ext}" extension. Re-export the file and try again.`,
    };
  }

  if (file.size <= 0 || file.size < MIN_UPLOAD_BYTES) {
    return { ok: false, reason: "This file looks empty or corrupted. Please pick a complete resume file." };
  }

  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      reason: `File is ${formatMb(file.size)} — the limit for ${ext.replace(".", "").toUpperCase()} uploads is ${formatMb(rule.maxBytes)}.`,
    };
  }

  return { ok: true, kind: rule.kind, mimeType: declared || rule.mimeTypes[0] };
}
