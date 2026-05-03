# System Architecture

## 1. High-Level System Architecture

```mermaid
graph TD
    Client[React PWA - Citizen/Officer] -->|HTTPS/WSS| CDN[Firebase Hosting / Cloud CDN]
    CDN -->|Static Assets| Browser[Web Browser]
    
    Client -->|Auth| FirebaseAuth[Firebase Authentication]
    Client -->|Realtime Data| Firestore[Firestore DB]
    
    Client -->|REST API Requests| API_Gateway[Cloud Run - FastAPI Backend]
    
    API_Gateway -->|RAG Queries, Gen Text/Quiz| VertexAI[Vertex AI - Gemini 1.5 Pro]
    API_Gateway -->|Fetch Embeddings| VectorStore[Vertex Vector Search / pgvector]
    
    API_Gateway -->|Check Rules/Claims| AdminSDK[Firebase Admin SDK]
    API_Gateway -->|Upload/Moderate| GCS[Google Cloud Storage]
    
    Worker[Cloud Tasks / Background Worker] -->|Ingest| YouTube[YouTube API]
    Worker -->|Summarize| VertexAI
    Worker -->|Store Context| VectorStore
```

## 2. Dynamic RAG & Gamification Flow

```mermaid
sequenceDiagram
    participant User
    participant ReactUI as React PWA
    participant FastAPI as Cloud Run Backend
    participant Gemini as Vertex AI (Gemini)
    participant DB as Firestore & Vector Store

    User->>ReactUI: Voice/Text Query: "How do I register to vote?"
    ReactUI->>FastAPI: POST /chat/query {text: ...}
    FastAPI->>DB: Fetch relevant election context (Vector Similarity)
    DB-->>FastAPI: Return chunks (Guidelines, deadlines)
    FastAPI->>Gemini: Prompt: Context + Query
    Gemini-->>FastAPI: Generated Answer + Suggested Quiz Question
    FastAPI->>DB: Save Chat History & Generated Quiz
    FastAPI-->>ReactUI: JSON {answer, audio_url, new_quiz_available}
    ReactUI-->>User: Display Text + Play Audio (Web Speech/TTS)
    User->>ReactUI: Takes Quiz
    ReactUI->>DB: Updates Score directly via Firebase Client
```

## 3. Deployment Architecture

```mermaid
graph LR
    subgraph GitHub
        Code[Source Code]
        GH_Actions[GitHub Actions CI/CD]
    end

    subgraph Google Cloud Platform
        SecretMgr[Secret Manager]
        CloudBuild[Cloud Build]
        ArtifactReg[Artifact Registry]
        CloudRun[Cloud Run - API]
        FirebaseHosting[Firebase Hosting - Web]
    end

    Code --> GH_Actions
    GH_Actions -->|Trigger| CloudBuild
    CloudBuild -->|Pull Secrets| SecretMgr
    CloudBuild -->|Build & Push| ArtifactReg
    ArtifactReg -->|Deploy Image| CloudRun
    GH_Actions -->|Deploy UI| FirebaseHosting
```

## 4. Offline Sync Architecture (PWA)

```mermaid
graph TD
    App[PWA Client] --> ServiceWorker[Service Worker]
    ServiceWorker -->|Cache Static| CacheStorage[Cache API]
    ServiceWorker -->|Intercept API| LocalDB[IndexedDB / SQLite WASM]
    
    LocalDB <-->|Sync when Online| Firestore[Firestore Realtime]
    LocalDB <-->|Sync when Online| FastAPI[Cloud Run Sync Endpoint]
    
    App -->|Reads/Writes| LocalDB
```

## 5. Security & Moderation Flow

```mermaid
graph TD
    Candidate[Political Candidate] -->|Uploads Manifesto PDF/Video| PWA[Frontend PWA]
    PWA -->|Direct Upload via Signed URL| GCS_Quarantine[GCS Quarantine Bucket]
    
    GCS_Quarantine -->|Event Trigger| EventArc[Eventarc]
    EventArc -->|Invoke| CloudFunction[Cloud Function Moderation]
    CloudFunction -->|Analyze Content| GeminiV[Gemini 1.5 Pro Vision/Text]
    
    GeminiV -->|Result: Clean| GCS_Public[GCS Public Bucket]
    GeminiV -->|Result: Flagged| Firestore_Queue[Firestore Moderation Queue]
    
    Firestore_Queue -->|Manual Review| Officer[Election Officer / Admin Dashboard]
```
