-- SQLite Schema for Offline PWA Mode (Client-side WASM or local caching)
-- This mirrors the critical portions of Firestore for offline reads

CREATE TABLE IF NOT EXISTS timeline_phases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER,
    required_role TEXT
);

CREATE TABLE IF NOT EXISTS cached_quizzes (
    id TEXT PRIMARY KEY,
    phase_id TEXT,
    questions_json TEXT, -- JSON string of questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL, -- e.g., 'SUBMIT_QUIZ', 'SAVE_CHAT'
    payload_json TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
    uid TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    total_points INTEGER DEFAULT 0,
    badges_json TEXT
);
