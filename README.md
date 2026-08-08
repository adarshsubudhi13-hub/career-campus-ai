# Lumen — AI Career Intelligence & Skill Gap Copilot

> Upload your resume, set a goal, and let AI build your roadmap, projects, interviews, and job matches. Become job-ready, faster.

🔗 **Live Demo:** [skillbridge-ai-05.lovable.app](https://skillbridge-ai-05.lovable.app)

---

## ✨ Overview

**Lumen** (project codename: **SkillSync AI**) is an AI-powered career intelligence platform that helps students, freshers, and professionals identify skill gaps, prepare for jobs, and receive personalized career guidance — all in one place.

Instead of juggling separate tools for resume building, interview prep, coding practice, and job search, Lumen analyzes a user's full profile (resume, skills, GitHub, LinkedIn, career goals) and generates a single, continuously updated roadmap to close the gap between where they are and the job they want.

## 🚀 Features

- **Student Upload Portal** — Resume parsing (PDF / DOCX / OCR) with auto-extraction of education, skills, projects, experience, certifications, and languages
- **Skill Gap Analysis** — Visual dashboard comparing current skills vs. industry demand, with a Future Readiness Score
- **Personalized Learning Roadmap** — Auto-generated 30/60/90-day, 6-month, and 1-year plans with videos, courses, and practice problems
- **AI Project Generator** — Beginner to industry-level project ideas with architecture, tech stack, and resume-ready descriptions
- **AI Resume Analyzer** — ATS score, formatting/grammar checks, keyword gaps, and one-click rewrites
- **AI Mock Interviews** — Voice/video/text interviews (technical, behavioral, HR, system design) with scored feedback
- **Coding Assessment** — Multi-language problem solving with AI-graded logic, complexity, and style
- **Job Matching** — Ranked job recommendations based on skills, goals, and experience
- **AI Career Mentor** — 24/7 chatbot for career guidance, salary negotiation, and roadmap help
- **Profile Boosters** — GitHub analyzer, LinkedIn optimizer, and soft-skill analyzer
- **Gamified Career Dashboard** — XP, streaks, badges, and offer-probability tracking

## 🛠️ Tech Stack

**Frontend**
- Next.js, React, TypeScript
- Tailwind CSS, Framer Motion
- ShadCN UI

**Backend**
- Node.js / Express.js
- FastAPI (AI services)

**Database**
- PostgreSQL, MongoDB, Redis

**AI / ML**
- OpenAI GPT, Gemini, LangChain
- Pinecone / ChromaDB (vector search)
- Whisper (speech), OCR

**Auth & Storage**
- Clerk / Auth.js / Firebase
- AWS S3 / Cloudinary

**Charts**
- Recharts, Chart.js

**Deployment**
- Vercel, Railway, Docker

## 📸 Screenshots

<!-- Add screenshots or a demo GIF here -->
<!-- ![Landing Page](./assets/screenshot-landing.png) -->
<!-- ![Skill Gap Dashboard](./assets/screenshot-dashboard.png) -->

## 🏗️ Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn
- PostgreSQL & MongoDB instances (local or hosted)
- API keys for OpenAI/Gemini (and any other AI services in use)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/lumen.git
cd lumen

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following (adjust to what your build actually uses):

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
DATABASE_URL=
MONGODB_URI=
REDIS_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📦 Deployment

This project is built and deployed via [Lovable](https://lovable.dev) and hosted at:

👉 [https://skillbridge-ai-05.lovable.app](https://skillbridge-ai-05.lovable.app)

To deploy your own instance:
1. Push this repo to GitHub
2. Connect the repo to Vercel (or your platform of choice)
3. Add the environment variables listed above in your hosting dashboard
4. Deploy 🚀

## 🗺️ Roadmap

- [ ] Wire up live resume parsing (PDF/DOCX/OCR)
- [ ] Connect real AI-generated skill-gap analysis
- [ ] Live mock interview scoring
- [ ] Recruiter-facing dashboard
- [ ] Job board API integrations

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## 📄 License

<!-- Add your license here, e.g. MIT -->

## 👤 Author

Built by [Your Name / Team Name].

---

⭐ If you find this project interesting, consider giving it a star!
