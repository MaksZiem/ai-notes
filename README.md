<p align="center">
  <img src=".github/assets/banner.svg" alt="AI Notes – Notion-style notes with real-time co-editing, semantic search, RAG chat and a tool-using agent" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-completed-3ccf91?style=flat-square" alt="Status: completed">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 11">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tiptap-3-1a1a1a?style=flat-square" alt="Tiptap 3">
  <img src="https://img.shields.io/badge/Yjs-CRDT-3ccf91?style=flat-square" alt="Yjs CRDT">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO">
  <img src="https://img.shields.io/badge/Gemini-RAG%20%2B%20agent-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini RAG and agent">
</p>

<p align="center">
  <a href="#-highlights">Highlights</a> ·
  <a href="#-screenshots">Screenshots</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-quick-start">Quick start</a> ·
  <a href="portfolio/PORTFOLIO.en.md">Full case study</a>
</p>

---

> **Your notes, edited together and answered by AI.** A rich Tiptap editor with **conflict-free real-time co-editing** (Yjs + Hocuspocus), granular sharing with expiring links, live notifications, and an AI layer on Gemini: writing helpers, **semantic search**, **"chat with your notes" (RAG)** with sources, and an **agent** that searches, reads, creates and updates notes.

<p align="center">
  <img src="portfolio/screenshots/collab.webp" alt="Two users editing the same note live, with named cursors" width="100%">
</p>

## ✨ Highlights

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>👥 Real-time co-editing</h3>
      A Yjs document per note, synced through Hocuspocus, with named cursors. <b>VIEW-only users get a read-only connection</b>: they see changes live, and the server rejects their updates.
    </td>
    <td width="50%" valign="top">
      <h3>🔑 Granular sharing</h3>
      <code>VIEW &lt; EDIT &lt; DELETE</code> on notes and projects, with project access inherited by its notes. Share links can be locked to an email address, expire and be revoked. Invites have accept/decline.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>💬 Chat with your notes (RAG)</h3>
      The question is embedded, and the top 5 notes by cosine similarity go into the prompt. The model answers <b>only from your notes</b> and returns clickable sources.
    </td>
    <td width="50%" valign="top">
      <h3>🤖 Tool-using agent</h3>
      A Gemini function-calling loop with <code>search_notes</code>, <code>get_note</code>, <code>create_note</code>, <code>list_projects</code> and <code>update_current_note</code>. Every tool step is visible in the UI.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>✍️ AI writing helpers</h3>
      Generate, continue from the cursor, rewrite a selection, suggest a title and keywords, and summarize a note or a whole project.
    </td>
    <td width="50%" valign="top">
      <h3>🔔 Live notifications</h3>
      Socket.IO room per user for shares, revocations, claimed links and invites, decoupled through domain events. Emails go out through Resend.
    </td>
  </tr>
</table>

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><img src="portfolio/screenshots/editor.webp" alt="Rich-text editor"></td>
    <td width="50%"><img src="portfolio/screenshots/agent.webp" alt="AI agent panel"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Editor</b> with slash commands, toolbar and AI actions</sub></td>
    <td align="center"><sub><b>AI agent</b> searching, reading and updating notes</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="portfolio/screenshots/rag-chat.webp" alt="RAG chat"></td>
    <td width="50%"><img src="portfolio/screenshots/share.webp" alt="Sharing dialog"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Chat with your notes</b>: answer with source notes</sub></td>
    <td align="center"><sub><b>Sharing</b>: members, access levels, expiring links</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="portfolio/screenshots/projects.webp" alt="Projects"></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><sub><b>Projects</b>, pinned and favourite notes, and an AI project summary</sub></td>
  </tr>
</table>

## 🏗️ Architecture

```mermaid
flowchart LR
  ED["📝 Tiptap editor<br/>+ Collaboration extension"]
  UI["🖥️ React SPA<br/>notes · projects · chat · agent"]
  REST["⚙️ REST API<br/>notes · projects · sharing"]
  ACL{{"🔑 getAccessLevel<br/>one permission resolver"}}
  AIS["✨ AiService<br/>generate · embed · RAG"]
  AG["🤖 AgentService<br/>function calling"]
  YJS["🔄 Hocuspocus :1234<br/>auth · load · store"]
  NGW["🔔 Socket.IO<br/>/notifications"]
  PG[("🐘 PostgreSQL<br/>notes · members · links<br/>embeddings · yjsState")]
  GEM[["Gemini"]]
  MAIL[["✉️ Resend"]]

  UI -- axios + JWT --> REST
  ED <-- Yjs updates over WS --> YJS
  UI <-- live events --> NGW
  REST --> ACL
  AG -- tools --> ACL
  YJS -- onAuthenticate --> ACL
  ACL --> PG
  REST --> AIS --> GEM
  REST --> AG --> GEM
  YJS --> PG
  REST -. domain events .-> NGW
  NGW -.-> MAIL

  classDef accent fill:#0a1d15,stroke:#3ccf91,color:#d5f7e8
  classDef store fill:#111118,stroke:#5b5b6b,color:#d4d4d8
  class ED,UI,REST,ACL,AIS,AG,YJS,NGW accent
  class PG,GEM,MAIL store
```

Three channels, each fit for its job: **REST** for CRUD and AI, a **Hocuspocus WebSocket** for document sync and **Socket.IO** for notifications. Permissions are computed in **one place** and reused by REST, the agent's tools and the collaboration server.

<details>
<summary><b>🔄 How "chat with your notes" works</b></summary>

```mermaid
sequenceDiagram
  actor U as User
  participant NS as NotesService
  participant G as Gemini
  participant DB as PostgreSQL

  Note over NS,DB: on every save: embedding = embed(title + content)
  U->>NS: "What budget did we agree on?"
  NS->>G: embed(question)
  G-->>NS: query vector
  NS->>DB: notes the user can access
  NS->>NS: cosine similarity, score > 0.5, top 5
  NS->>G: "Answer ONLY from these notes"
  G-->>NS: answer
  NS-->>U: answer + source notes
```

</details>

## 🧰 Tech stack

| | |
|---|---|
| **Frontend** | React 19 · Vite · Tiptap 3 · Yjs + Hocuspocus provider · TanStack Query · MUI · Tailwind CSS v4 · Zod |
| **Backend** | NestJS 11 · TypeORM · Socket.IO · Hocuspocus server · EventEmitter · nestjs-i18n · Swagger |
| **Data** | PostgreSQL: `jsonb` embeddings, `bytea` Yjs state, per-user pin and favourite preferences |
| **AI** | Google Gemini: text generation, function calling, embeddings |
| **Infra** | Resend (email) · local image uploads |
| **Quality** | Jest · class-validator DTOs · ESLint · Prettier · `*.http` request files |

## 🚀 Quick start

Requirements: **Node.js**, **PostgreSQL**, a **Gemini API key** and, optionally, a **Resend API key**.

```bash
# backend → http://localhost:3001  (Swagger: /api/docs, Hocuspocus on :1234)
cd backend
cp .env.example .env      # PORT, YJS_PORT, DB_*, JWT_SECRET, GEMINI_*, RESEND_API_KEY, FRONTEND_URL
npm install
npm run migration:run
npm run start:dev

# frontend → http://localhost:3000
cd ../frontend
npm install
npm run dev
```

## 📁 Project structure

```text
ai-notes/
├── backend/            NestJS API + Hocuspocus server
│   └── src/
│       ├── notes/  projects/   CRUD, sharing, share links, search, RAG
│       ├── ai/                 writing helpers, embeddings
│       ├── agent/              function-calling loop and tools
│       ├── yjs/                collaboration server (auth, load, store)
│       ├── notifications/      events → Socket.IO + email
│       └── uploads/  mail/  users/
├── frontend/           React + Vite SPA
└── portfolio/          case study (EN/PL) and screenshots
```

## 🗺️ Roadmap

- [ ] pgvector + ANN index instead of in-memory similarity
- [ ] Version history from Yjs snapshots, comments
- [ ] Offline mode with IndexedDB persistence
- [ ] Streaming AI responses

## 📖 Read more

The full case study covers the problem, the data model, the API, an example run step by step, key decisions and trade-offs, and what I learned: **[English](portfolio/PORTFOLIO.en.md)** · **[Polski](portfolio/PORTFOLIO.pl.md)**.

---

<p align="center">
  <sub>Built by <a href="https://github.com/MaksZiem"><b>Maksymilian Ziembicki</b></a> · Full-stack developer</sub>
</p>
