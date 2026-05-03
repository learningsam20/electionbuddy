# Technical Specification (Tech Spec)

## 1. Technology Stack

### 1.1 Frontend
*   **Framework:** React 18 with Vite
*   **UI Library:** Material UI (MUI) / Tailwind CSS for rapid, responsive gamified styling.
*   **State Management:** Zustand or Redux Toolkit.
*   **PWA & Offline:** Service Workers, IndexedDB, localForage (fallback to SQLite WASM for complex offline querying).
*   **Voice/Media:** Web Speech API, React Webcam.
*   **i18n:** `react-i18next`.

### 1.2 Backend (API & Orchestration)
*   **Framework:** FastAPI (Python 3.11+) for high-performance, async endpoint handling.
*   **Server:** Uvicorn.
*   **AI SDK:** Google Genkit / Vertex AI SDK for Python. LangChain/LlamaIndex for RAG orchestration.
*   **Auth:** Firebase Admin SDK (Validating JWTs, setting custom claims).

### 1.3 Database & Storage
*   **Primary DB:** Firebase Firestore (Realtime sync, client-side caching, RBAC via rules).
*   **Vector Store:** pgvector (via Cloud SQL) or Vertex AI Vector Search for RAG document retrieval.
*   **Storage:** Google Cloud Storage (GCS) with distinct buckets (public-assets, quarantine-uploads, private-docs).

### 1.4 Cloud & Deployment (GCP)
*   **Compute:** Google Cloud Run (Serverless, auto-scaling container for FastAPI).
*   **Hosting:** Firebase Hosting (for the React PWA, backed by Cloud CDN).
*   **CI/CD:** GitHub Actions -> Google Cloud Build -> Artifact Registry.
*   **Secrets:** Google Cloud Secret Manager.

## 2. API Design & Endpoints

### 2.1 Chat & RAG (`/api/v1/chat`)
*   `POST /chat/query`: Accepts `{ text: str, audio_url: str, image_url: str, context: dict }`. Uses Gemini to return `{ response: str, audio_reply_url: str, sources: list }`.

### 2.2 Gamification & Quizzes (`/api/v1/quiz`)
*   `GET /quiz/generate`: Accepts `{ topic: str, difficulty: str, phase: str }`. Calls Gemini to generate a 5-question JSON quiz.
*   `POST /quiz/submit`: Validates answers, updates user score in Firestore, returns delta.

### 2.3 Media & Ingestion (`/api/v1/media`)
*   `POST /media/youtube-ingest`: Accepts `{ youtube_url: str }`. Background task fetches transcript, chunks it, embeds it, and stores it in the Vector Store.
*   `GET /media/signed-url`: Returns a secure upload URL for candidates to submit media directly to GCS quarantine.

### 2.4 Analytics (`/api/v1/analytics`)
*   `GET /analytics/dashboard`: Returns aggregated metrics based on user's custom claim (e.g., district officer gets district stats).

## 3. Data Models (Firestore)

*   **Users:** `users/{uid}` -> `{ name, email, role, district, assembly_constituency, age, gender, language, total_points, badges: [] }`
*   **Quizzes:** `quizzes/{quiz_id}` -> `{ generated_by, questions: [], phase, created_at }`
*   **Chat History:** `users/{uid}/chats/{chat_id}` -> `{ messages: [{role, content, timestamp}] }`
*   **Timeline Phases:** `timeline/{phase_id}` -> `{ title, description, video_url, required_role }`
*   **DistrictStats (Aggregated):** `stats/{district_id}` -> `{ total_registered, male_count, female_count, gen_z_count, millennial_count, assembly_stats: { "assembly_1": { total: 5000, male: 2500, female: 2500 } } }`

## 4. Security & Role-Based Access Control (RBAC)

*   **Authentication:** Firebase Authentication (Google, Phone/OTP).
*   **Custom Claims:** Set upon registration or by Super Admin (`{ admin: true, role: 'officer', district: 'pune' }`).
*   **Firestore Rules:**
    *   Citizens can read `timeline` and write to their own `users/{uid}`.
    *   Officers can read aggregated `analytics` for their district.
    *   Media uploads go to `quarantine` bucket; Cloud Function triggers Gemini to review, then moves to `public` bucket.

## 5. Setup & Deployment Strategy

### 5.1 Local Development
1. Use `docker-compose` to spin up local FastAPI, Redis (if needed for rate limiting), and Firebase Local Emulator Suite.
2. React app runs via `npm run dev` pointing to local APIs.

### 5.2 Google Cloud Deployment Steps
1.  **GCP Project Setup:** Enable Vertex AI, Cloud Run, Cloud Build, Identity Platform, and GCS APIs.
2.  **Firebase Integration:** Link GCP project to Firebase. Setup Firestore and Auth.
3.  **Service Accounts:** Create a least-privilege service account for Cloud Run to access Vertex AI and GCS.
4.  **CI/CD Pipeline:** On `push` to `main`, GitHub Actions builds the Docker image, pushes to Artifact Registry, and deploys to Cloud Run using `gcloud run deploy`.

### 5.3 Scripts to be Generated
*   `Dockerfile`: Multi-stage build for FastAPI backend.
*   `.env.example`: Template for API keys.
*   `deploy.sh`: One-click gcloud deployment script.
*   `firebase.json` & `firestore.rules`: Security configurations.
*   `schema.sql`: For the offline SQLite WASM fallback mechanism.
