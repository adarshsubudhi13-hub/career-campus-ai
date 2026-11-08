import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Upload, Sparkles, Brain, Target, FileText, Mic, Code2, Briefcase,
  MessageCircle, BookOpen, Github, Linkedin, Trophy, Bell, BarChart3,
  Zap, ArrowRight, CheckCircle2, Play, ChevronRight, Wand2, Compass,
  LineChart, Rocket, GraduationCap, ShieldCheck, Globe, Search, LogOut,
  Users, Lock, Layers, XCircle,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeUploader } from "@/components/ResumeUploader";
import ImportEverywhere from "@/components/ImportEverywhere";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — AI Career Intelligence for Students" },
      { name: "description", content: "Upload your resume, set a goal, and let AI build your roadmap, projects, interviews, and job matches. Become job-ready, faster." },
      { property: "og:title", content: "Lumen — AI Career Intelligence for Students" },
      { property: "og:description", content: "Upload your resume, set a goal, and let AI build your roadmap, projects, interviews, and job matches. Become job-ready, faster." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <LogoStrip />
      <HowItWorks />
      <UploadPortal />

      <AnalysisEngine />
      <Roadmap />
      <ProjectGenerator />
      <ResumeAndInterview />
      <CodingAndJobs />
      <MentorAndLearning />
      <ProfileBoosters />
      <Dashboard />
      <UniqueFeatures />
      <Differentiation />
      <Pricing />
      <About />
      <CTA />

      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */
function Nav() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setEmail(s?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-background font-bold">L</div>
          <span className="font-display text-lg font-semibold tracking-tight">Lumen</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#roadmap" className="hover:text-foreground transition">Roadmap</a>
          <a href="#interview" className="hover:text-foreground transition">Interview</a>
          <a href="#jobs" className="hover:text-foreground transition">Jobs</a>
          {email && <Link to="/resumes" className="hover:text-foreground transition">My resumes</Link>}
        </nav>
        <div className="flex items-center gap-3">
          {email ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/resumes">{email}</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
              >
                <LogOut className="mr-1 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild className="bg-brand text-primary-foreground hover:bg-brand/90">
                <Link to="/auth">Get started <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* animated orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[500px] w-[500px] rounded-full bg-brand-2/30 blur-3xl animate-orb" />
      <div aria-hidden className="pointer-events-none absolute -top-24 right-0 -z-10 h-[450px] w-[450px] rounded-full bg-brand/30 blur-3xl animate-orb" style={{ animationDelay: "-6s" }} />

      <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>AI Career Intelligence Engine · v2.0</span>
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Land your dream job with{" "}
            <span className="text-gradient">AI-powered career intelligence</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Upload your resume, skills, and career goals. AI analyzes your profile, identifies missing skills,
            recommends projects, prepares you for interviews, and matches you with the best jobs.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group bg-brand text-primary-foreground hover:bg-brand/90 glow-ring">
              <a href="#features">
                <Upload className="mr-2 h-4 w-4" /> Upload resume
                <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="glass border-border/60">
              <Play className="mr-2 h-4 w-4" /> Try demo
            </Button>
            <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Compass className="mr-2 h-4 w-4" /> Explore careers
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Free for students</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Privacy first</span>
          </div>
        </div>

        {/* hero card */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-10 -bottom-8 h-24 rounded-full bg-brand/20 blur-3xl" aria-hidden />
          <div className="glass rounded-2xl p-2 shadow-[var(--shadow-elevated)]">
            <div className="rounded-xl border border-border/60 bg-card/80 p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-3">
                <StatCard label="ATS Resume Score" value="92" hint="+18 after AI fixes" tone="brand" />
                <StatCard label="Future Readiness" value="78%" hint="Top 12% of cohort" tone="brand-2" />
                <StatCard label="Job Matches" value="47" hint="this week" tone="brand-3" />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-5">
                <SkillBar label="React" pct={86} />
                <SkillBar label="Python" pct={72} />
                <SkillBar label="System Design" pct={48} tone="warn" />
                <SkillBar label="SQL" pct={68} />
                <SkillBar label="AWS" pct={34} tone="warn" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "brand" | "brand-2" | "brand-3" }) {
  const ring = tone === "brand" ? "ring-brand/40" : tone === "brand-2" ? "ring-brand-2/40" : "ring-brand-3/40";
  const dot = tone === "brand" ? "bg-brand" : tone === "brand-2" ? "bg-brand-2" : "bg-brand-3";
  return (
    <div className={`rounded-xl border border-border/50 bg-background/40 p-5 ring-1 ${ring}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse-glow`} />
      </div>
      <div className="mt-2 font-display text-4xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function SkillBar({ label, pct, tone }: { label: string; pct: number; tone?: "warn" }) {
  const color = tone === "warn" ? "bg-brand-3" : "bg-brand";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground/80">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------- Capability strip (no unverified social proof) ---------- */
function LogoStrip() {
  const items = [
    "Live AI resume parsing",
    "PDF · DOCX · Image OCR",
    "Private by default",
    "Free for students",
  ];
  return (
    <section className="border-y border-border/40 bg-background/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {items.map((t) => <span key={t}>{t}</span>)}
      </div>
    </section>
  );
}


/* ---------- Section wrappers ---------- */
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {eyebrow}
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">{sub}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`group relative rounded-2xl border border-border/60 bg-[image:var(--gradient-card)] p-6 transition hover:border-brand/40 ${className}`}>
      {children}
    </div>
  );
}

function FeatureIcon({ icon: Icon, tone = "brand" }: { icon: any; tone?: "brand" | "brand-2" | "brand-3" }) {
  const bg = tone === "brand" ? "bg-brand/15 text-brand" : tone === "brand-2" ? "bg-brand-2/15 text-brand-2" : "bg-brand-3/15 text-brand-3";
  return <div className={`mb-4 inline-grid h-10 w-10 place-items-center rounded-lg ${bg}`}><Icon className="h-5 w-5" /></div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">{children}</span>;
}

/* ---------- Upload Portal ---------- */
function UploadPortal() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Student Upload Portal" title="One profile. Everything extracted." sub="Drop your resume in any format. We auto-extract education, skills, projects, experience, certifications, achievements, and languages." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold">Upload your resume</h3>
              <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or image — OCR included. We parse it into a structured profile in seconds.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Pill>PDF</Pill><Pill>DOCX</Pill><Pill>Image · OCR</Pill></div>
          </div>
          <ResumeUploader />
          <div className="mt-4 flex flex-wrap gap-2">
            {["Education","Skills","Projects","Experience","Certifications","Achievements","Languages"].map(t => <Pill key={t}>{t}</Pill>)}
          </div>
        </div>
        <Card>
          <FeatureIcon icon={Github} tone="brand-2" />
          <h3 className="font-display text-xl font-semibold">Import everywhere</h3>
          <p className="mt-2 text-sm text-muted-foreground">Pull in skills and projects from the platforms you already use.</p>
          <ImportEverywhere />

        </Card>
      </div>


      {/* career goal */}
      <div className="mt-10">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <FeatureIcon icon={Target} tone="brand-3" />
              <h3 className="font-display text-xl font-semibold">Pick a career goal</h3>
              <p className="mt-1 text-sm text-muted-foreground">Or type your own. Every recommendation adapts to it.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Software Engineer","Data Scientist","AI Engineer","ML Engineer","Cybersecurity","Cloud Engineer","Product Manager","UI/UX Designer","DevOps","Startup Founder","Custom goal…"].map(t => (
              <button key={t} className="rounded-full border border-border/60 bg-background/40 px-3.5 py-1.5 text-sm text-muted-foreground transition hover:border-brand/50 hover:text-foreground">{t}</button>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ---------- Analysis Engine ---------- */
function AnalysisEngine() {
  const scores = [
    { label: "Technical", v: 82 }, { label: "Soft skills", v: 71 },
    { label: "Domain", v: 64 }, { label: "Communication", v: 78 },
    { label: "Leadership", v: 55 }, { label: "Interview", v: 69 },
    { label: "Coding", v: 74 }, { label: "ATS resume", v: 92 },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="AI Analysis Engine" title="Skill-gap analysis, beautifully visualised." sub="See where you stand vs. the industry — current skills, missing ones, demand, and a future-readiness score." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold">Skill gap heatmap</h3>
              <p className="text-sm text-muted-foreground">Against the top 10% of hires at your target role.</p>
            </div>
            <div className="hidden gap-2 sm:flex"><Pill>Current</Pill><Pill>Missing</Pill><Pill>Demand</Pill></div>
          </div>
          <div className="mt-6 grid grid-cols-8 gap-1.5">
            {Array.from({ length: 64 }).map((_, i) => {
              const intensity = ((i * 37) % 100) / 100;
              const color = intensity > 0.66 ? "bg-brand/80" : intensity > 0.33 ? "bg-brand-2/60" : "bg-muted";
              return <div key={i} className={`aspect-square rounded ${color}`} />;
            })}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {scores.map(s => (
              <div key={s.label} className="rounded-lg border border-border/50 bg-background/30 p-3">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">{s.label}</span><span>{s.v}</span></div>
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <FeatureIcon icon={Brain} />
            <h4 className="font-display text-lg font-semibold">Confidence score</h4>
            <p className="mt-1 text-sm text-muted-foreground">Across technical, behavioural & system design.</p>
            <div className="mt-4 font-display text-5xl font-semibold text-gradient">86<span className="text-2xl text-muted-foreground">/100</span></div>
          </Card>
          <Card>
            <FeatureIcon icon={LineChart} tone="brand-2" />
            <h4 className="font-display text-lg font-semibold">Future readiness</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {["Strength: React, Python","Weak: System design, AWS","Priority: DSA medium tier"].map(t => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" /> {t}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------- Roadmap ---------- */
function Roadmap() {
  const plans = [
    { d:"30-Day", c:"Sprint", items:["Daily videos","Practice problems","Mini projects"] },
    { d:"60-Day", c:"Build", items:["Intermediate projects","Mock interviews","ATS resume v2"] },
    { d:"90-Day", c:"Apply", items:["Industry project","System design drills","Job applications"] },
    { d:"6-Month", c:"Specialise", items:["Domain depth","Open source PRs","Certifications"] },
    { d:"1-Year", c:"Senior-track", items:["Leadership signals","Conference talks","Mentorship"] },
  ];
  return (
    <section id="roadmap" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Personalised Roadmap" title="A plan for today, this month, this year." sub="AI generates 30 / 60 / 90-day, 6-month and 1-year plans with videos, articles, courses, problems, mini-projects and revision schedules." />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {plans.map((p, i) => (
          <Card key={p.d} className="flex flex-col">
            <div className="text-xs text-muted-foreground">Phase {i+1}</div>
            <div className="mt-1 font-display text-2xl font-semibold">{p.d}</div>
            <div className="text-sm text-brand">{p.c}</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {p.items.map(it => <li key={it} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-brand mt-0.5"/>{it}</li>)}
            </ul>
            <div className="mt-5 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${20*(i+1)}%` }} />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- Project Generator ---------- */
function ProjectGenerator() {
  const tiers = [
    { t:"Beginner", color:"brand" as const, desc:"Confidence builders with clean tech stacks." },
    { t:"Intermediate", color:"brand-2" as const, desc:"Real APIs, auth, databases, deployment." },
    { t:"Industry-level", color:"brand-3" as const, desc:"Scalable systems with architecture diagrams." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="AI Project Generator" title="Projects worth putting on your resume." sub="From beginner builds to hackathon winners and startup ideas — each ships with architecture, tech stack, features, DB design, APIs, deployment guide, GitHub structure, resume bullet & interview questions." />
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map(t => (
          <Card key={t.t}>
            <FeatureIcon icon={Rocket} tone={t.color} />
            <h3 className="font-display text-xl font-semibold">{t.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Architecture diagram","Tech stack & DB design","Deployment guide","Resume bullet + interview Qs"].map(x => (
                <li key={x} className="flex gap-2"><ChevronRight className="h-4 w-4 text-brand mt-0.5"/>{x}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        {["Hackathon ideas","Startup ideas","Open source contributions","FAANG-style systems"].map(t => <Pill key={t}>{t}</Pill>)}
      </div>
    </section>
  );
}

/* ---------- Resume + Interview ---------- */
function ResumeAndInterview() {
  return (
    <section id="interview" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Resume & Interviews" title="Ship a resume recruiters open. Walk into interviews calm." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <FeatureIcon icon={FileText} />
          <h3 className="font-display text-2xl font-semibold">AI Resume Analyzer</h3>
          <p className="mt-2 text-sm text-muted-foreground">ATS · formatting · grammar · keyword analysis. One-click rewrite. Generate multiple targeted versions.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[["ATS","92"],["Format","88"],["Grammar","95"]].map(([k,v]) => (
              <div key={k} className="rounded-lg border border-border/50 bg-background/30 p-3 text-center">
                <div className="font-display text-2xl font-semibold text-brand">{v}</div>
                <div className="text-xs text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Startup","FAANG","Internship","Fresher"].map(t => (
              <button key={t} className="rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs hover:border-brand/50">{t} resume</button>
            ))}
          </div>
        </Card>
        <Card>
          <FeatureIcon icon={Mic} tone="brand-2" />
          <h3 className="font-display text-2xl font-semibold">AI Mock Interview</h3>
          <p className="mt-2 text-sm text-muted-foreground">Voice, video & text. Technical, behavioural, HR, system design, coding, case studies. Scored with replay.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {[["Confidence","82%"],["Communication","88%"],["Technical","74%"],["Eye contact","91%"]].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-3">
                <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">+ filler word count, speaking pace, grammar analysis & per-answer replay.</div>
        </Card>
      </div>
    </section>
  );
}

/* ---------- Coding + Jobs ---------- */
function CodingAndJobs() {
  return (
    <section id="jobs" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Code & Match" title="Solve, ship, and get matched to roles that fit." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <FeatureIcon icon={Code2} tone="brand-3" />
          <h3 className="font-display text-2xl font-semibold">Coding assessment</h3>
          <p className="mt-2 text-sm text-muted-foreground">Python · Java · C++ · JavaScript · SQL. AI grades logic, time & memory complexity, optimisation and style.</p>
          <pre className="mt-5 overflow-x-auto rounded-lg border border-border/50 bg-background/60 p-4 text-xs leading-relaxed">
<span className="text-muted-foreground"># two-sum · medium</span>{"\n"}
<span className="text-brand-2">def</span> two_sum(nums, target):{"\n"}
{"  "}seen = {`{}`}{"\n"}
{"  "}<span className="text-brand-2">for</span> i, n <span className="text-brand-2">in</span> enumerate(nums):{"\n"}
{"    "}<span className="text-brand-2">if</span> target - n <span className="text-brand-2">in</span> seen:{"\n"}
{"      "}<span className="text-brand-2">return</span> [seen[target - n], i]{"\n"}
{"    "}seen[n] = i
          </pre>
          <div className="mt-3 flex gap-2 text-xs">
            <Pill>O(n) time</Pill><Pill>O(n) space</Pill><Pill>Style 9/10</Pill>
          </div>
        </Card>
        <Card>
          <FeatureIcon icon={Briefcase} />
          <h3 className="font-display text-2xl font-semibold">Job matching</h3>
          <p className="mt-2 text-sm text-muted-foreground">We aggregate roles through official job-board APIs and partner feeds — then rank them against your parsed profile.</p>
          <div className="mt-5 space-y-3">
            {[
              {co:"Stripe", role:"Software Engineer, New Grad", match:94, sal:"$140k–$180k"},
              {co:"Vercel", role:"Frontend Engineer", match:88, sal:"$130k–$165k"},
              {co:"OpenAI", role:"ML Engineer Intern", match:81, sal:"$10k/mo"},
            ].map(j => (
              <div key={j.co} className="flex items-center gap-4 rounded-lg border border-border/50 bg-background/30 p-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-2 font-bold text-background">{j.co[0]}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{j.role}</div>
                  <div className="text-xs text-muted-foreground">{j.co} · {j.sal}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-semibold text-brand">{j.match}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">match</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ---------- Mentor + Learning ---------- */
function MentorAndLearning() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Mentor & Learning" title="A mentor on call. A library that knows you." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <FeatureIcon icon={MessageCircle} />
          <h3 className="font-display text-2xl font-semibold">AI Career Mentor</h3>
          <p className="mt-2 text-sm text-muted-foreground">24/7 chat for career guidance, resume tips, salary negotiation, scholarships, higher studies & more.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl rounded-bl-sm border border-border/50 bg-background/40 p-3 text-sm">How do I negotiate an internship offer at a startup?</div>
            <div className="ml-8 rounded-2xl rounded-br-sm border border-brand/30 bg-brand/10 p-3 text-sm">Lead with their pain, not your number. Anchor at the top of the band with a 30/60/90 plan attached…</div>
          </div>
        </Card>
        <Card>
          <FeatureIcon icon={BookOpen} tone="brand-2" />
          <h3 className="font-display text-2xl font-semibold">AI Learning Hub</h3>
          <p className="mt-2 text-sm text-muted-foreground">Personalised YouTube videos, docs, GitHub repos, papers, books, courses, blogs, notes & cheat-sheets.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {["YouTube videos","Docs & specs","GitHub repos","Research papers","Books","Courses","Blogs","Cheat sheets"].map(t => (
              <div key={t} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 p-2.5">
                <Search className="h-3.5 w-3.5 text-brand" /> {t}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ---------- Profile boosters ---------- */
function ProfileBoosters() {
  const items = [
    { icon: Github, t:"GitHub Analyzer", d:"Repos, code quality, languages, commit activity, complexity & portfolio score — plus fixes." },
    { icon: Linkedin, t:"LinkedIn Optimizer", d:"Headline, summary, banner, featured, experience, networking strategy & post ideas." },
    { icon: ShieldCheck, t:"Soft Skill Analyzer", d:"Communication, leadership, critical thinking, creativity, teamwork, presentation, time mgmt." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Profile Boosters" title="Make every surface recruiter-ready." />
      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({icon,t,d}) => (
          <Card key={t}>
            <FeatureIcon icon={icon} />
            <h3 className="font-display text-xl font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- Dashboard ---------- */
function Dashboard() {
  return (
    <section id="dashboard" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Career Dashboard" title="Your career, in one calm screen." sub="Profile completion, interview readiness, skill & learning progress, projects, certificates, applications and offer probability — with gamified XP, badges, levels, streaks & leaderboards." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Welcome back</div>
              <div className="font-display text-2xl font-semibold">Today's plan</div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-brand-3"/> 12-day streak</span>
              <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-brand"/> Level 8</span>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {[
              ["DSA · Sliding window medium", "30 min"],
              ["System design · URL shortener", "45 min"],
              ["Mock interview · Behavioural", "20 min"],
              ["Read · Designing Data-Intensive Apps ch. 5", "25 min"],
            ].map(([t,d]) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-3">
                <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-brand"/><span className="text-sm">{t}</span></div>
                <span className="text-xs text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <FeatureIcon icon={BarChart3} tone="brand-2" />
            <h4 className="font-display text-lg font-semibold">Offer probability</h4>
            <div className="mt-3 font-display text-5xl font-semibold text-gradient">63%</div>
            <p className="mt-1 text-xs text-muted-foreground">Based on roles you've applied to in the last 30 days.</p>
          </Card>
          <Card>
            <FeatureIcon icon={Bell} tone="brand-3" />
            <h4 className="font-display text-lg font-semibold">Reminders</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Stripe OA closes Friday</li>
              <li>• New scholarship match (3)</li>
              <li>• Hackathon · weekend</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------- Unique features ---------- */
function UniqueFeatures() {
  const items = [
    { icon: GraduationCap, t:"Employability score", d:"AI predicts your hireability — and what moves it the most." },
    { icon: LineChart, t:"Salary prediction", d:"Forecast comp by skills, location and role tier." },
    { icon: Compass, t:"Career timeline", d:"From fresher to senior — see your next 5 roles." },
    { icon: Brain, t:"Digital twin interviewer", d:"A simulated you that learns from every mock." },
    { icon: Wand2, t:"One-click JD tailoring", d:"Resume & cover letter rewritten per job description." },
    { icon: Sparkles, t:"What-if simulator", d:"\"If I learn React + AWS in 3 months…\" — see the new outcome." },
    { icon: Globe, t:"Portfolio in one click", d:"Generate a portfolio site from your resume + GitHub." },
    { icon: ShieldCheck, t:"Verified-skill recruiting", d:"Recruiter dashboard surfaces talent by proven skill." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader eyebrow="Why students win with Lumen" title="Unfair advantages, built in." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({icon:Icon,t,d}) => (
          <Card key={t}>
            <FeatureIcon icon={Icon} tone={(["brand","brand-2","brand-3"] as const)[t.length % 3]} />
            <h4 className="font-display text-lg font-semibold">{t}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 p-10 md:p-16 text-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-card)" }} />
        <h2 className="mx-auto max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
          Your <span className="text-gradient">career, accelerated.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Upload your resume in 30 seconds. Get your first roadmap before your coffee.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="bg-brand text-primary-foreground hover:bg-brand/90 glow-ring">
            <Upload className="mr-2 h-4 w-4"/> Upload resume
          </Button>
          <Button size="lg" variant="outline" className="glass">
            <Play className="mr-2 h-4 w-4"/> Try the demo
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-brand to-brand-2 font-bold text-background">L</div>
          <span>© {new Date().getFullYear()} Lumen · AI Career Intelligence</span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-foreground" href="#">Privacy</a>
          <a className="hover:text-foreground" href="#">Terms</a>
          <a className="hover:text-foreground" href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  const steps = [
    { icon: Upload, t: "1 · Upload", d: "Drop a PDF, DOCX or a photo of your resume. OCR handles scans." },
    { icon: Brain, t: "2 · AI parses it", d: "A live AI call extracts skills, experience, projects and education into a structured profile." },
    { icon: Target, t: "3 · See your gaps", d: "Your profile is compared against your target role to surface missing skills." },
    { icon: Rocket, t: "4 · Act on it", d: "Roadmap, project ideas, interview prep and matched roles — built from your real data." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="How it works"
        title="Four steps, one honest pipeline."
        sub="Steps 1 and 2 are live today — your resume is really parsed by AI and saved to your profile. Steps 3 and 4 are illustrated with sample data while we wire them up."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, t, d }, i) => (
          <Card key={t}>
            <FeatureIcon icon={Icon} tone={(["brand", "brand-2", "brand-3"] as const)[i % 3]} />
            <h4 className="font-display text-lg font-semibold">{t}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------- Differentiation ---------- */
function Differentiation() {
  const rows: { f: string; lumen: string; others: string }[] = [
    { f: "Starting point", lumen: "Your parsed resume becomes a living profile", others: "One-off score on an uploaded file" },
    { f: "Output", lumen: "Skill gaps → roadmap → projects → interviews in one loop", others: "Separate tools for resume, jobs and prep" },
    { f: "Audience", lumen: "Students and early-career, with no prior track record", others: "Optimised for experienced job switchers" },
    { f: "Proof of skill", lumen: "Projects and assessments generated from your gaps", others: "Keyword matching against a JD" },
    { f: "Job sourcing", lumen: "Official job-board APIs and partner feeds", others: "Board-specific plugins or manual search" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Why Lumen"
        title="Not another resume scorer."
        sub="Teal, Rezi, Careerflow and LinkedIn optimise a document. Lumen builds the person behind it."
      />
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-[image:var(--gradient-card)]">
        <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-3">
          <div className="bg-background/40 px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">Dimension</div>
          <div className="bg-background/40 px-5 py-3 text-xs uppercase tracking-widest text-brand">Lumen</div>
          <div className="bg-background/40 px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">Typical tools</div>
          {rows.map((r) => (
            <div key={r.f} className="contents">
              <div className="bg-background/20 px-5 py-4 text-sm font-medium">{r.f}</div>
              <div className="flex gap-2 bg-background/20 px-5 py-4 text-sm text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {r.lumen}
              </div>
              <div className="flex gap-2 bg-background/20 px-5 py-4 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 opacity-60" /> {r.others}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function Pricing() {
  const tiers = [
    {
      name: "Student",
      price: "Free",
      note: "Always free with a student email",
      icon: GraduationCap,
      features: ["Resume parsing & saved profile", "Skill-gap analysis", "Roadmap + project ideas", "3 mock interviews / month"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      note: "per month · cancel anytime",
      icon: Rocket,
      features: ["Unlimited mock interviews", "JD-tailored resume & cover letters", "Salary + what-if simulator", "Priority job matching"],
      cta: "Go Pro",
      highlight: true,
    },
    {
      name: "Recruiter",
      price: "Custom",
      note: "Seat-based, billed annually",
      icon: Users,
      features: ["Verified-skill candidate search", "Assessment-backed shortlists", "Team collaboration & notes", "ATS integrations"],
      cta: "Talk to us",
      highlight: false,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Business model"
        title="Free for students. Paid by everyone else."
        sub="Students never pay. Pro covers heavier AI usage, and recruiter seats fund the platform."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map(({ name, price, note, icon: Icon, features, cta, highlight }) => (
          <Card key={name} className={highlight ? "border-brand/50 glow-ring" : ""}>
            <FeatureIcon icon={Icon} tone={highlight ? "brand" : "brand-2"} />
            <div className="flex items-baseline gap-2">
              <h4 className="font-display text-lg font-semibold">{name}</h4>
              {highlight && <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[11px] text-brand">Popular</span>}
            </div>
            <div className="mt-3 font-display text-4xl font-semibold">{price}</div>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {features.map((f) => (
                <li key={f} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {f}</li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full" variant={highlight ? "default" : "outline"}>
              <Link to="/auth">{cta}</Link>
            </Button>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Pricing shown is our intended launch model, not yet billed.</p>
    </section>
  );
}

/* ---------- About / team ---------- */
function About() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="About Lumen"
        title="Built by students who hated the black box."
        sub="Applications disappear with no feedback. Lumen exists to tell you exactly what's missing and what to build next."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <FeatureIcon icon={Sparkles} />
          <h4 className="font-display text-lg font-semibold">Why we're building it</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Every rejection is a data point nobody shares with you. We started Lumen to turn a resume into a
            measurable, improvable profile — so a student can see the gap between where they are and the role
            they want, and close it with concrete work instead of guesswork.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-lg border border-border/50 bg-background/30 p-3">
              <Layers className="mb-2 h-4 w-4 text-brand" />
              <div className="font-medium">Stack</div>
              <p className="mt-1 text-xs text-muted-foreground">React + TanStack Start, Postgres, AI-powered parsing.</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/30 p-3">
              <Lock className="mb-2 h-4 w-4 text-brand-2" />
              <div className="font-medium">Your data</div>
              <p className="mt-1 text-xs text-muted-foreground">Resumes are private to your account and deletable anytime.</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/30 p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-brand-3" />
              <div className="font-medium">Honest status</div>
              <p className="mt-1 text-xs text-muted-foreground">Sections still using sample data are labelled as illustrative.</p>
            </div>
          </div>
        </Card>
        <Card>
          <FeatureIcon icon={Play} tone="brand-3" />
          <h4 className="font-display text-lg font-semibold">Product walkthrough</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            A short demo of the live upload → AI parse → saved profile flow.
          </p>
          <div className="mt-4 grid aspect-video place-items-center rounded-xl border border-dashed border-border/60 bg-background/30 text-center">
            <div className="px-4">
              <Play className="mx-auto h-8 w-8 text-brand" />
              <p className="mt-2 text-xs text-muted-foreground">Demo video coming soon — try the live uploader above in the meantime.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4 w-full">
            <a href="#features"><Upload className="mr-2 h-4 w-4" /> Try it yourself</a>
          </Button>
        </Card>
      </div>
    </section>
  );
}
