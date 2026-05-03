# Requirement

Create an assistant that helps users understand the election process, timelines, and steps in an interactive and easy-to-follow way.

# Summary

Build a Cloud Run–deployed React + FastAPI app that uses Vertex AI / Gemini (via Firebase AI Logic or Genkit) for multimodal Q&A, plus Firebase Auth/Firestore for realtime data and RBAC, GCS for media, and an optional SQLite offline mode—featuring voice I/O, rich media, quizzes, audit trails, and human‑in‑the‑loop moderation. This design targets Pune/India rollout with regional GCP resources and PWA offline support.

# Key features (functional)

Interactive Timeline Navigator — persona filters, clickable stages (registration → nomination → campaigning → polling → counting → certification).

Gemini Chat Assistant — context‑aware prompts, RAG from curated KB, multimodal support (images/audio metadata).

Voice I/O — speech‑to‑text for spoken queries (Web Speech API / Vertex Speech), text‑to‑speech for answers (Vertex TTS), plus voice playback of media and quiz narration.

Multimedia Library — GCS buckets (public, private, quarantine), adaptive streaming, auto‑generated captions/alt text via Gemini.

Quizzes & Simulations — offline‑capable, progress sync, printable certificates.

RBAC & Admin Console — Firebase Auth + custom claims; roles: Super Admin, Election Commission, State Employee, District Officer, Polling Staff, Campaign Manager, Auditor, Media, Citizen, Public.

Offline Mode — PWA + IndexedDB + optional SQLite (WASM) with sync engine and conflict rules.

Notifications — in‑app, email, SMS (via Cloud Tasks + SendGrid/Cloud SMS gateway).

Audit & Moderation — immutable audit logs, moderation queue for AI outputs and uploaded media.

Technical architecture (high level)
Frontend: React + Material UI, react-i18next, PWA, Web Speech API; optional client‑side Gemini via Firebase AI Logic for low‑latency prototypes.

Backend: Python FastAPI (UVicorn) on Cloud Run; acts as secure proxy to Vertex AI Gemini, issues signed GCS URLs, enforces RBAC.

AI: Vertex AI / Gemini via server‑side Genkit or Firebase AI Logic; use RAG with Firestore/BigQuery as retrieval store; human review pipeline for flagged responses.

DB & Storage: Firestore primary; SQLite toggle for local/offline; GCS for media; BigQuery for analytics.

CI/CD & Ops: GitHub Actions or Cloud Build → Artifact Registry → Cloud Run; Cloud Logging/Monitoring; secrets in Secret Manager.

Decision table — core choices
Component Managed cloud Local/offline
DB Firestore (realtime, RBAC) SQLite (offline sync)
Media GCS + Cloud CDN Local dev storage
AI access Vertex AI / Genkit Firebase AI Logic (client prototyping)
Deployment Cloud Run Local Docker for dev

RBAC & DB access (summary)
Custom claims set via Admin SDK (e.g., role: 'commission'); Firestore rules enforce collection‑level access (admins CRUD elections; district officers limited to district docs; campaign managers upload to quarantine). Example rules and claim flows follow Firebase best practices.

Risks & mitigations
AI hallucination / misinformation: use RAG from curated KB, conservative system prompts, and human moderation queue.

PII exposure: minimize PII, mask sensitive fields, enforce least privilege, CMEK if required.

Scale/cost: cache AI responses, TTLs for media, monitor Firestore read/write patterns.

# Instructions

Generate a detailed requirements spec as well as technical spec based on the background.md. This is an app getting built for hackathon, so must include innovative features, especially using google services. Should have voice interface so that users can interact with it. It should have gamification to have users involvement and learning the election process and get bonus points/leaderboard. The assistant needs to be answer all the questions using RAG. It should be able to pull images and videos from youtube and use for training. It should also generate questions using LLM and store in the database. The UI should be very intuitive and easy to use. It should also support different languages. The app should be deployed on google cloud. We are from India. The app must have a lot of AI and next gen features to meet the requirements, so please add additional features to make it stand out. This is needed for hackathon.
Also, it must generate the scripts for DB based on the requirements, dockefile, gitignore file, .env for all configurations, gcloud run deployment configurations, firebase setup (authentication, rules, indexes), and provide complete steps to deploy the app on google cloud.
Should be a PWA.
Must have rich user interface and experience with many gemini driven AI features.
Must also support different roles like citizen, election officer, political candidate, etc. And each role should have different features and permissions.
It must also have a feature to generate reports based on the role and user data, including rich analytics and visualizations. Must have support for multiple languages.
Goal is to educate about election process, increase awareness and participation in elections, and create a more informed electorate. Should be a fun and engaging experience that encourages users to learn about the election process and get involved in the democratic process.
