import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listResumes, deleteResume, getResumeSignedUrl } from "@/lib/resumes.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText, Download, Trash2, ArrowLeft, Upload, Loader2,
  Calendar, Sparkles, LogOut,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/resumes")({
  head: () => ({
    meta: [
      { title: "My resumes — Lumen" },
      { name: "description", content: "Your saved resumes and parsed career profiles." },
    ],
  }),
  component: ResumesPage,
});

function ResumesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchList = useServerFn(listResumes);
  const callDelete = useServerFn(deleteResume);
  const callSign = useServerFn(getResumeSignedUrl);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => fetchList(),
  });

  const del = useMutation({
    mutationFn: (id: string) => callDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Resume deleted");
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  async function handleDownload(path: string, name: string) {
    try {
      const { url } = await callSign({ data: { path } });
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.click();
    } catch (e: any) {
      toast.error(e?.message || "Could not download file");
    }
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 font-bold">L</div>
            <span className="font-display text-lg font-semibold">Lumen</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Home</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">My resumes</h1>
            <p className="mt-1 text-sm text-muted-foreground">Every resume you upload is saved here with the AI-parsed profile.</p>
          </div>
          <Button asChild className="bg-brand text-primary-foreground hover:bg-brand/90">
            <Link to="/"><Upload className="mr-2 h-4 w-4" /> Upload new</Link>
          </Button>
        </div>

        <div className="mt-8">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          )}
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
          {!isLoading && data && data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-brand" />
              <h3 className="mt-3 font-display text-lg font-semibold">No resumes yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Upload your first resume from the homepage to get started.</p>
              <Button asChild className="mt-5 bg-brand text-primary-foreground hover:bg-brand/90">
                <Link to="/"><Upload className="mr-2 h-4 w-4" /> Upload resume</Link>
              </Button>
            </div>
          )}
          <ul className="space-y-3">
            {data?.map((r) => {
              const isOpen = expanded === r.id;
              const skills = Array.isArray(r.parsed?.skills) ? r.parsed.skills : [];
              return (
                <li key={r.id} className="rounded-xl border border-border/60 bg-[image:var(--gradient-card)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand" />
                        <span className="truncate font-medium">{r.file_name}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(r.created_at).toLocaleString()}</span>
                        {r.file_size ? <span>{(r.file_size / 1024).toFixed(1)} KB</span> : null}
                        {r.parsed?.name ? <span>· {r.parsed.name}</span> : null}
                      </div>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {skills.slice(0, 8).map((s: string, i: number) => (
                            <span key={i} className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[11px]">{s}</span>
                          ))}
                          {skills.length > 8 && <span className="text-[11px] text-muted-foreground">+{skills.length - 8} more</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setExpanded(isOpen ? null : r.id)}>
                        {isOpen ? "Hide details" : "View details"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(r.file_path, r.file_name)}>
                        <Download className="mr-1 h-3.5 w-3.5" /> Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={del.isPending}
                        onClick={() => {
                          if (confirm("Delete this resume?")) del.mutate(r.id);
                        }}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-border/40 bg-background/40 p-3 text-xs">
                      {JSON.stringify(r.parsed, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}
