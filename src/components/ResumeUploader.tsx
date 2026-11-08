import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2,
  XCircle, RefreshCw, Sparkles, Save, LogIn, Ban, FileSearch, Cpu, CloudUpload,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseResume, type ParsedResume } from "@/lib/parse-resume.functions";
import { saveResume } from "@/lib/resumes.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCEPT_ATTRIBUTE,
  SUPPORTED_FORMATS_LABEL,
  MAX_UPLOAD_BYTES,
  RESUME_RULES,
  validateResumeFile,
} from "@/lib/resume-file-rules";


type StepId = "read" | "parse" | "save";
type StepState = "pending" | "active" | "done" | "error" | "cancelled" | "skipped";
type Phase = "idle" | "running" | "done" | "error" | "cancelled";

type StepInfo = {
  id: StepId;
  label: string;
  activeLabel: string;
  doneLabel: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: StepInfo[] = [
  { id: "read", label: "Read file", activeLabel: "Reading file…", doneLabel: "File read", icon: FileSearch },
  { id: "parse", label: "AI parse", activeLabel: "AI extracting profile…", doneLabel: "Profile extracted", icon: Cpu },
  { id: "save", label: "Save to profile", activeLabel: "Uploading & saving…", doneLabel: "Saved to profile", icon: CloudUpload },
];

const ACCEPT = ACCEPT_ATTRIBUTE;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error ?? new Error("Read failed"));
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.readAsDataURL(file);
  });
}


function initialSteps(): Record<StepId, StepState> {
  return { read: "pending", parse: "pending", save: "pending" };
}

class CancelledError extends Error {
  constructor() { super("Cancelled by user"); this.name = "CancelledError"; }
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
}

function buildResumeCsv(result: ParsedResume, fileName: string): string {
  const rows: string[] = ["Section,Item,Field,Value"];
  const add = (section: string, item: string, field: string, value: string) =>
    rows.push([escapeCsv(section), escapeCsv(item), escapeCsv(field), escapeCsv(value)].join(","));

  add("Profile", "0", "name", result.name);
  add("Profile", "0", "email", result.email);
  add("Profile", "0", "phone", result.phone);
  add("Profile", "0", "location", result.location);
  add("Profile", "0", "headline", result.headline);
  add("Profile", "0", "summary", result.summary);

  result.skills.forEach((skill, i) => add("Skills", String(i + 1), "skill", skill));

  result.experience.forEach((exp, i) => {
    const item = String(i + 1);
    add("Experience", item, "role", exp.role);
    add("Experience", item, "company", exp.company);
    add("Experience", item, "duration", exp.duration);
    add("Experience", item, "highlights", exp.highlights.join("; "));
  });

  result.education.forEach((edu, i) => {
    const item = String(i + 1);
    add("Education", item, "degree", edu.degree);
    add("Education", item, "institution", edu.institution);
    add("Education", item, "year", edu.year);
    add("Education", item, "gpa", edu.gpa);
  });

  result.projects.forEach((proj, i) => {
    const item = String(i + 1);
    add("Projects", item, "name", proj.name);
    add("Projects", item, "description", proj.description);
    add("Projects", item, "tech", proj.tech.join("; "));
  });

  result.certifications.forEach((c, i) => add("Certifications", String(i + 1), "certification", c));
  result.achievements.forEach((a, i) => add("Achievements", String(i + 1), "achievement", a));
  result.languages.forEach((l, i) => add("Languages", String(i + 1), "language", l));

  rows.push("");
  rows.push([escapeCsv("Source"), escapeCsv("0"), escapeCsv("file_name"), escapeCsv(fileName)].join(","));
  rows.push([escapeCsv("Source"), escapeCsv("0"), escapeCsv("parsed_at"), escapeCsv(new Date().toISOString())].join(","));

  return rows.join("\n");
}

export function ResumeUploader() {
  const callParse = useServerFn(parseResume);
  const callSave = useServerFn(saveResume);
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Record<StepId, StepState>>(initialSteps);
  const [failedStep, setFailedStep] = useState<StepId | null>(null);
  const [error, setError] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountIdRef = useRef<string>(Math.random().toString(36).slice(2, 8));
  const inFlightRef = useRef<string | null>(null);
  const cancelRef = useRef<AbortController | null>(null);
  // Cached artifacts so we can retry a single step without redoing prior work.
  type ParsePayload = { kind: "pdf" | "image" | "text"; data: string; mimeType?: string; filename?: string };
  const payloadRef = useRef<ParsePayload | null>(null);
  const parsedRef = useRef<ParsedResume | null>(null);
  const uploadedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const id = mountIdRef.current;
    console.log(`[ResumeUploader:${id}] mount`);
    return () => {
      console.log(`[ResumeUploader:${id}] UNMOUNT`, { inFlightReqId: inFlightRef.current });
    };
  }, []);

  useEffect(() => {
    const id = mountIdRef.current;
    supabase.auth.getUser().then(({ data }) => {
      console.log(`[ResumeUploader:${id}] initial getUser`, { userId: data.user?.id ?? null });
      setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.log(`[ResumeUploader:${id}] onAuthStateChange`, { event, userId: s?.user?.id ?? null });
      setUserId(s?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const setStep = (id: StepId, state: StepState) =>
    setSteps((s) => ({ ...s, [id]: state }));

  const checkCancel = (ctrl: AbortController) => {
    if (ctrl.signal.aborted) throw new CancelledError();
  };

  const runFromStep = useCallback(async (startStep: StepId, f: File) => {
    const mountId = mountIdRef.current;
    const reqId = Math.random().toString(36).slice(2, 8);
    const t0 = performance.now();
    const log = (msg: string, extra?: Record<string, unknown>) =>
      console.log(
        `[ResumeUploader:${mountId}][req:${reqId}] +${Math.round(performance.now() - t0)}ms ${msg}`,
        extra ?? "",
      );

    log("run:start", { startStep, name: f.name, size: f.size, type: f.type, currentUserId: userId });

    setError("");
    setFailedStep(null);
    // Reset the starting step and everything downstream; keep earlier "done" steps.
    setSteps((prev) => {
      const next = { ...prev };
      const order: StepId[] = ["read", "parse", "save"];
      const startIdx = order.indexOf(startStep);
      for (let i = 0; i < order.length; i++) {
        if (i >= startIdx) next[order[i]] = "pending";
      }
      return next;
    });

    const validation = validateResumeFile(f);
    if (!validation.ok) {
      log("run:blocked invalid file", { reason: validation.reason });
      setPhase("error");
      setFailedStep("read");
      setStep("read", "error");
      setError(validation.reason);
      toast.error(validation.reason);
      return;
    }
    const kind = validation.kind;

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      log("run:blocked no session");
      setPhase("error");
      setFailedStep("parse");
      setStep("parse", "error");
      setError("Please sign in to parse your resume — AI parsing is available to signed-in students.");
      return;
    }


    const ctrl = new AbortController();
    cancelRef.current = ctrl;
    inFlightRef.current = reqId;
    setPhase("running");

    try {
      // Step 1: read
      if (startStep === "read" || !payloadRef.current) {
        setStep("read", "active");
        let payload: ParsePayload;
        if (kind === "pdf") {
          const b64 = await fileToBase64(f);
          checkCancel(ctrl);
          payload = { kind: "pdf", data: b64, mimeType: f.type || "application/pdf", filename: f.name };
        } else if (kind === "image") {
          const b64 = await fileToBase64(f);
          checkCancel(ctrl);
          payload = { kind: "image", data: b64, mimeType: f.type || "image/png", filename: f.name };
        } else {
          const mammoth = await import("mammoth/mammoth.browser");
          const arrayBuffer = await f.arrayBuffer();
          checkCancel(ctrl);
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          const text = (value || "").trim();
          if (!text) throw new Error("Could not read text from this DOCX file.");
          payload = { kind: "text", data: text, filename: f.name };
        }
        payloadRef.current = payload;
        setStep("read", "done");
      } else {
        log("read:skipped (cached)");
        setStep("read", "done");
      }

      // Step 2: parse
      if (startStep === "read" || startStep === "parse" || !parsedRef.current) {
        checkCancel(ctrl);
        setStep("parse", "active");
        log("callParse:start", { payloadKind: payloadRef.current!.kind });
        const parsed = await callParse({ data: payloadRef.current! });
        checkCancel(ctrl);
        log("callParse:done", { skills: parsed.skills?.length ?? 0 });
        parsedRef.current = parsed;
        setResult(parsed);
        setStep("parse", "done");
      } else {
        log("parse:skipped (cached)");
        setResult(parsedRef.current);
        setStep("parse", "done");
      }

      // Step 3: save
      if (!userId) {
        setStep("save", "skipped");
        setPhase("done");
        log("save:skipped (not signed in)");
        return;
      }

      setStep("save", "active");
      let path = uploadedPathRef.current;
      if (!path) {
        const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
        path = `${userId}/${crypto.randomUUID()}.${ext}`;
        log("save:storage upload", { path });
        const { error: upErr } = await supabase.storage
          .from("resumes")
          .upload(path, f, { contentType: f.type || undefined, upsert: false });
        if (upErr) throw upErr;
        uploadedPathRef.current = path;
      } else {
        log("save:storage upload skipped (already uploaded)", { path });
      }
      checkCancel(ctrl);
      log("save:db insert");
      await callSave({
        data: {
          file_name: f.name,
          file_path: path,
          file_size: f.size,
          mime_type: f.type || null,
          parsed: parsedRef.current,
        },
      });
      setStep("save", "done");
      setPhase("done");
      toast.success("Saved to your profile");
    } catch (e: any) {
      const cancelled = e instanceof CancelledError || ctrl.signal.aborted;
      let activeStep: StepId | null = null;
      setSteps((prev) => {
        const active = (Object.keys(prev) as StepId[]).find((k) => prev[k] === "active") ?? null;
        activeStep = active;
        if (active) {
          const nextState: StepState = cancelled ? "cancelled" : "error";
          const rest = { ...prev, [active]: nextState };
          if (cancelled) {
            for (const k of ["read", "parse", "save"] as StepId[]) {
              if (rest[k] === "pending") rest[k] = "cancelled";
            }
          }
          return rest;
        }
        return prev;
      });
      setTimeout(() => setFailedStep(activeStep), 0);
      setPhase(cancelled ? "cancelled" : "error");
      setError(cancelled ? "Cancelled." : (e?.message || "Something went wrong."));
      log(cancelled ? "run:CANCELLED" : "run:ERROR", { name: e?.name, message: e?.message });
      if (!cancelled) console.error(e);
    } finally {
      if (inFlightRef.current === reqId) inFlightRef.current = null;
      if (cancelRef.current === ctrl) cancelRef.current = null;
      log("run:end");
    }
  }, [callParse, callSave, userId]);

  const handleFile = useCallback(async (f: File) => {
    payloadRef.current = null;
    parsedRef.current = null;
    uploadedPathRef.current = null;
    setResult(null);
    setFile(f);
    setSteps(initialSteps());
    await runFromStep("read", f);
  }, [runFromStep]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const cancel = () => {
    console.log(`[ResumeUploader:${mountIdRef.current}] cancel:clicked`, {
      inFlightReqId: inFlightRef.current,
    });
    cancelRef.current?.abort();
  };

  const reset = () => {
    cancelRef.current?.abort();
    setPhase("idle");
    setSteps(initialSteps());
    setFailedStep(null);
    setFile(null);
    setResult(null);
    setError("");
    payloadRef.current = null;
    parsedRef.current = null;
    uploadedPathRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  };

  const retryStep = (step: StepId) => {
    if (!file) return;
    runFromStep(step, file);
  };
  const retryFailed = () => {
    if (!file) return;
    runFromStep(failedStep ?? "read", file);
  };

  const isRunning = phase === "running";
  const showParsedView = phase === "done" && result;

  return (
    <div className="rounded-2xl border border-border/60 bg-[image:var(--gradient-card)] p-6 md:p-8">
      {!showParsedView && (
        <>
          <div
            onDragOver={(e) => { if (!isRunning) { e.preventDefault(); setDragOver(true); } }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { if (!isRunning) onDrop(e); }}
            onClick={() => { if (!isRunning) inputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            aria-disabled={isRunning}
            onKeyDown={(e) => {
              if (isRunning) return;
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={`group rounded-xl border-2 border-dashed p-8 text-center transition ${
              isRunning ? "cursor-not-allowed opacity-90" : "cursor-pointer"
            } ${
              dragOver ? "border-brand bg-brand/5" : "border-border/80 bg-background/30 hover:border-brand/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {phase === "idle" && (
              <>
                <Upload className="mx-auto h-8 w-8 text-brand" />
                <p className="mt-3 text-sm">
                  Drop your resume here or <span className="text-brand">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {SUPPORTED_FORMATS_LABEL}. Size limits: PDF up to 10 MB, DOCX up to 5 MB, images up to 8 MB.
                </p>

              </>
            )}
            {phase !== "idle" && file && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-brand" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  · {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
            )}
          </div>

          {phase !== "idle" && (
            <Stepper
              steps={steps}
              phase={phase}
              failedStep={failedStep}
              error={error}
              onCancel={cancel}
              onRetry={retryFailed}
              onRetryStep={retryStep}
              onReset={reset}
              signedIn={!!userId}
            />
          )}

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {userId
              ? "Signed in — uploads are parsed and saved to your profile."
              : "Sign in to parse and save your resume."}
          </p>

        </>
      )}

      {showParsedView && result && (
        <ParsedView
          result={result}
          fileName={file?.name ?? "resume"}
          onReset={reset}
          userId={userId}
          saveState={steps.save === "done" ? "saved" : steps.save === "error" ? "error" : steps.save === "active" ? "saving" : "idle"}
          onRetrySave={() => retryStep("save")}
        />
      )}
    </div>
  );
}

function Stepper({
  steps, phase, failedStep, error, onCancel, onRetry, onRetryStep, onReset, signedIn,
}: {
  steps: Record<StepId, StepState>;
  phase: Phase;
  failedStep: StepId | null;
  error: string;
  onCancel: () => void;
  onRetry: () => void;
  onRetryStep: (step: StepId) => void;
  onReset: () => void;
  signedIn: boolean;
}) {
  const visibleSteps = signedIn ? STEPS : STEPS.filter((s) => s.id !== "save");
  const failedLabel = failedStep ? STEPS.find((s) => s.id === failedStep)?.label : null;

  return (
    <div className="mt-5 rounded-xl border border-border/50 bg-background/40 p-4">
      <ol className="space-y-2">
        {visibleSteps.map((step, i) => {
          const state = steps[step.id];
          const Icon = step.icon;
          const canRetryThisStep =
            (state === "error" || state === "cancelled") && phase !== "running";
          return (
            <li key={step.id} className="flex items-center gap-3">
              <StepBadge state={state} index={i + 1} Icon={Icon} />
              <div className="flex-1">
                <div className={`text-sm font-medium ${stateTextClass(state)}`}>
                  {state === "active" ? step.activeLabel
                    : state === "done" ? step.doneLabel
                    : state === "error" ? `${step.label} — failed`
                    : state === "cancelled" ? `${step.label} — cancelled`
                    : state === "skipped" ? `${step.label} — skipped`
                    : step.label}
                </div>
                {failedStep === step.id && error && (
                  <div className="mt-0.5 text-xs text-destructive">{error}</div>
                )}
              </div>
              {canRetryThisStep && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRetryStep(step.id)}
                  className="h-7 px-2 text-xs"
                  aria-label={`Retry ${step.label} step`}
                >
                  <RefreshCw className="mr-1 h-3 w-3" /> Retry step
                </Button>
              )}
              <StepStateLabel state={state} />
            </li>
          );
        })}
      </ol>

      {phase === "error" && failedStep === "read" && error && (
        <ValidationError reason={error} onReset={onReset} />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {phase === "running" && (
          <Button size="sm" variant="outline" onClick={onCancel} className="glass">
            <Ban className="mr-2 h-3.5 w-3.5" /> Cancel
          </Button>
        )}
        {(phase === "error" || phase === "cancelled") && (
          <>
            <Button size="sm" variant="outline" onClick={onReset} className="glass">
              Start over
            </Button>
            <Button size="sm" onClick={onRetry} className="bg-brand text-primary-foreground hover:bg-brand/90">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              {failedLabel ? `Retry ${failedLabel.toLowerCase()}` : "Retry"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function StepBadge({ state, index, Icon }: { state: StepState; index: number; Icon: React.ComponentType<{ className?: string }> }) {
  if (state === "done") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-brand/15 text-brand">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-destructive/15 text-destructive">
        <XCircle className="h-4 w-4" />
      </div>
    );
  }
  if (state === "cancelled") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/15 text-amber-500">
        <Ban className="h-4 w-4" />
      </div>
    );
  }
  if (state === "skipped") {
    return (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-background text-muted-foreground text-xs">
      {index}
    </div>
  );
}

function StepStateLabel({ state }: { state: StepState }) {
  const cls = "text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 border";
  if (state === "done") return <span className={`${cls} border-emerald-500/30 bg-emerald-500/10 text-emerald-500`}>Done</span>;
  if (state === "active") return <span className={`${cls} border-brand/40 bg-brand/10 text-brand`}>In progress</span>;
  if (state === "error") return <span className={`${cls} border-destructive/40 bg-destructive/10 text-destructive`}>Failed</span>;
  if (state === "cancelled") return <span className={`${cls} border-amber-500/40 bg-amber-500/10 text-amber-500`}>Cancelled</span>;
  if (state === "skipped") return <span className={`${cls} border-border/60 bg-muted text-muted-foreground`}>Skipped</span>;
  return <span className={`${cls} border-border/60 bg-background/40 text-muted-foreground`}>Pending</span>;
}

function stateTextClass(state: StepState) {
  if (state === "error") return "text-destructive";
  if (state === "cancelled") return "text-amber-500";
  if (state === "done") return "text-foreground";
  if (state === "active") return "text-foreground";
  return "text-muted-foreground";
}


function ParsedView({
  result, fileName, onReset, userId, saveState, onRetrySave,
}: {
  result: ParsedResume;
  fileName: string;
  onReset: () => void;
  userId: string | null;
  saveState: "idle" | "saving" | "saved" | "error";
  onRetrySave: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">Profile extracted</div>
            <div className="text-xs text-muted-foreground">from {fileName}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="glass">
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Upload another
        </Button>
      </div>

      <SaveBanner userId={userId} saveState={saveState} onRetrySave={onRetrySave} />


      <div className="mt-6 rounded-xl border border-border/50 bg-background/40 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={result.name} />
          <Field label="Headline" value={result.headline} />
          <Field label="Email" value={result.email} />
          <Field label="Phone" value={result.phone} />
          <Field label="Location" value={result.location} />
        </div>
        {result.summary && (
          <div className="mt-4">
            <FieldLabel>Summary</FieldLabel>
            <p className="mt-1 text-sm text-foreground/90">{result.summary}</p>
          </div>
        )}
      </div>

      <Section title="Skills" count={result.skills.length}>
        <div className="flex flex-wrap gap-2">
          {result.skills.length === 0 && <Empty />}
          {result.skills.map((s, i) => (
            <span key={`${s}-${i}`} className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs text-foreground">
              {s}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Experience" count={result.experience.length}>
        {result.experience.length === 0 ? <Empty /> : (
          <ul className="space-y-3">
            {result.experience.map((x, i) => (
              <li key={i} className="rounded-lg border border-border/40 bg-background/30 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium">{x.role || "Role"} <span className="text-muted-foreground">· {x.company || "Company"}</span></div>
                  {x.duration && <div className="text-xs text-muted-foreground">{x.duration}</div>}
                </div>
                {Array.isArray(x.highlights) && x.highlights.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/85">
                    {x.highlights.map((h: string, j: number) => <li key={j}>{h}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Projects" count={result.projects.length}>
        {result.projects.length === 0 ? <Empty /> : (
          <ul className="space-y-3">
            {result.projects.map((p, i) => (
              <li key={i} className="rounded-lg border border-border/40 bg-background/30 p-3">
                <div className="font-medium">{p.name || "Project"}</div>
                {p.description && <p className="mt-1 text-sm text-foreground/85">{p.description}</p>}
                {Array.isArray(p.tech) && p.tech.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tech.map((t: string, j: number) => (
                      <span key={j} className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Education" count={result.education.length}>
        {result.education.length === 0 ? <Empty /> : (
          <ul className="space-y-2">
            {result.education.map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border/40 bg-background/30 p-3">
                <div>
                  <div className="font-medium">{e.degree || "Degree"}</div>
                  <div className="text-xs text-muted-foreground">{e.institution || ""}{e.gpa ? ` · GPA ${e.gpa}` : ""}</div>
                </div>
                {e.year && <div className="text-xs text-muted-foreground">{e.year}</div>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <SmallList title="Certifications" items={result.certifications} />
        <SmallList title="Achievements" items={result.achievements} />
        <SmallList title="Languages" items={result.languages} />
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <Button variant="outline" className="glass" onClick={() => {
          const payload = {
            source_file: fileName,
            parsed_at: new Date().toISOString(),
            ...result,
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const baseName = fileName.replace(/\.[^.]+$/, "") || result.name || "resume";
          a.href = url; a.download = `${baseName}-parse-result.json`; a.click();
          URL.revokeObjectURL(url);
        }}>
          <FileText className="mr-2 h-4 w-4" /> Download parse result
        </Button>
        <Button variant="outline" className="glass" onClick={() => {
          const csv = buildResumeCsv(result, fileName);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const baseName = fileName.replace(/\.[^.]+$/, "") || result.name || "resume";
          a.href = url; a.download = `${baseName}-parse-result.csv`; a.click();
          URL.revokeObjectURL(url);
        }}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV
        </Button>
        <Button className="bg-brand text-primary-foreground hover:bg-brand/90">
          <Sparkles className="mr-2 h-4 w-4" /> Analyze profile
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-0.5 text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-baseline gap-2">
        <h4 className="font-display text-base font-semibold">{title}</h4>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}
function Empty() {
  return <p className="text-sm text-muted-foreground">Not found in resume.</p>;
}
function SmallList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/30 p-3">
      <FieldLabel>{title}</FieldLabel>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((x, i) => (
            <li key={i} className="flex items-start gap-2">
              <ImageIcon className="mt-0.5 hidden h-3.5 w-3.5 text-brand" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadRulesSummary() {
  return (
    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
      {RESUME_RULES.map((rule) => (
        <li key={rule.kind} className="flex items-start gap-2">
          <span className="mt-1 block h-1 w-1 rounded-full bg-muted-foreground" />
          <span>
            <span className="font-medium text-foreground">{rule.extensions.map((e) => e.replace(".", "").toUpperCase()).join(", ")}</span>
            {" — up to "}{formatBytes(rule.maxBytes)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ValidationError({ reason, onReset }: { reason: string; onReset: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
          <XCircle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-destructive">Upload didn't pass validation</div>
          <p className="mt-1 text-sm text-foreground/90">{reason}</p>
          <div className="mt-3 rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="text-xs font-medium text-foreground">Accepted files</div>
            <UploadRulesSummary />
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={onReset}>
              Choose another file
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveBanner({
  userId, saveState, onRetrySave,
}: {
  userId: string | null;
  saveState: "idle" | "saving" | "saved" | "error";
  onRetrySave: () => void;
}) {
  if (!userId) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
        <div className="flex items-center gap-2">
          <LogIn className="h-4 w-4 text-brand" />
          <span>Sign in to save this resume to your profile.</span>
        </div>
        <Button asChild size="sm" className="bg-brand text-primary-foreground hover:bg-brand/90">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }
  if (saveState === "saving") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/40 bg-background/40 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Saving to your profile…
      </div>
    );
  }
  if (saveState === "saved") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
        <div className="flex items-center gap-2">
          <Save className="h-4 w-4 text-emerald-500" />
          <span>Saved to your profile.</span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/resumes">View my resumes</Link>
        </Button>
      </div>
    );
  }
  if (saveState === "error") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span>Could not save to your profile.</span>
        </div>
        <Button size="sm" variant="outline" onClick={onRetrySave}>Retry</Button>
      </div>
    );
  }
  return null;
}
