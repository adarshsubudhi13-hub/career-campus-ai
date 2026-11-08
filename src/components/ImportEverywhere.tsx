import { useState } from "react";
import { Code2, Github, Globe, Linkedin, Loader2, ChevronRight, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importCodingProfile,
  importGithub,
  importLinkedinText,
  importPortfolio,
  type ImportResult,
} from "@/lib/imports.functions";

type SourceId = "linkedin" | "github" | "coding" | "portfolio";

const SOURCES: { id: SourceId; icon: typeof Github; label: string; blurb: string }[] = [
  { id: "linkedin", icon: Linkedin, label: "LinkedIn profile", blurb: "Paste your profile text — we extract skills, roles and projects." },
  { id: "github", icon: Github, label: "GitHub repos", blurb: "We read your public repositories, languages and topics." },
  { id: "coding", icon: Code2, label: "Coding profiles · LeetCode, Codeforces", blurb: "Pull ratings and solved-problem counts." },
  { id: "portfolio", icon: Globe, label: "Portfolio website", blurb: "We fetch the page and extract your skills and projects." },
];

export default function ImportEverywhere() {
  const [open, setOpen] = useState<SourceId | null>(null);
  const [done, setDone] = useState<Record<string, ImportResult>>({});

  return (
    <>
      <ul className="mt-5 space-y-3 text-sm">
        {SOURCES.map(({ id, icon: Icon, label }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setOpen(id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border/40 bg-background/30 p-3 text-left transition-colors hover:border-brand/50 hover:bg-background/60"
            >
              <Icon className="h-4 w-4 text-brand" />
              <span className="flex-1">{label}</span>
              {done[id] ? (
                <Check className="h-4 w-4 text-brand" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {SOURCES.map((s) => (
        <ImportDialog
          key={s.id}
          source={s}
          open={open === s.id}
          onOpenChange={(v) => setOpen(v ? s.id : null)}
          result={done[s.id]}
          onResult={(r) => setDone((d) => ({ ...d, [s.id]: r }))}
        />
      ))}
    </>
  );
}

function ImportDialog({
  source,
  open,
  onOpenChange,
  result,
  onResult,
}: {
  source: { id: SourceId; icon: typeof Github; label: string; blurb: string };
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result?: ImportResult;
  onResult: (r: ImportResult) => void;
}) {
  const [value, setValue] = useState("");
  const [platform, setPlatform] = useState<"leetcode" | "codeforces">("leetcode");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      let r: ImportResult;
      if (source.id === "github") r = await importGithub({ data: { handle: value } });
      else if (source.id === "coding") r = await importCodingProfile({ data: { platform, handle: value } });
      else if (source.id === "portfolio") r = await importPortfolio({ data: { url: value } });
      else r = await importLinkedinText({ data: { text: value } });
      onResult(r);
      toast.success(`Imported from ${source.label.split(" ")[0]}`);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const friendly = /unauthor/i.test(msg)
        ? "Please sign in — AI-powered imports are available to signed-in students."
        : msg.replace(/^Error:\s*/, "");
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <source.icon className="h-4 w-4 text-brand" /> {source.label}
          </DialogTitle>
          <DialogDescription>{source.blurb}</DialogDescription>
        </DialogHeader>

        {source.id === "coding" && (
          <div className="flex gap-2">
            {(["leetcode", "codeforces"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={platform === p ? "default" : "outline"}
                onClick={() => setPlatform(p)}
              >
                {p === "leetcode" ? "LeetCode" : "Codeforces"}
              </Button>
            ))}
          </div>
        )}

        {source.id === "linkedin" ? (
          <Textarea
            rows={8}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Open your LinkedIn profile, select all of the About / Experience / Skills sections, and paste them here."
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim() && !loading) void run();
            }}
            placeholder={
              source.id === "github"
                ? "your-github-username"
                : source.id === "coding"
                  ? "your-handle"
                  : "https://your-portfolio.com"
            }
          />
        )}

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => void run()} disabled={loading || !value.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Importing…" : "Import"}
          </Button>
        </div>

        {result && <ResultView result={result} />}
      </DialogContent>
    </Dialog>
  );
}

function ResultView({ result }: { result: ImportResult }) {
  return (
    <div className="mt-2 rounded-xl border border-border/50 bg-background/40 p-4">
      <div className="font-display text-base font-semibold">{result.title}</div>
      {result.subtitle && <p className="mt-1 text-sm text-muted-foreground">{result.subtitle}</p>}

      {result.stats.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {result.stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border/40 bg-background/40 p-2 text-center">
              <div className="font-display text-lg">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {result.skills.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium">Skills detected</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.skills.map((s) => (
              <span key={s} className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.projects.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-medium">Projects</div>
          {result.projects.map((p) => (
            <div key={p.name} className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {p.name}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-brand">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
              {p.tech.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <span key={t} className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {result.notes.map((n) => (
        <p key={n} className="mt-3 text-xs text-muted-foreground">
          {n}
        </p>
      ))}
    </div>
  );
}
