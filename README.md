# 💼 JobAnalyser: AI Job Application Assistant

### 🌐 Live Application: [https://beast22803.github.io/ai-job-application-assistant/](https://beast22803.github.io/ai-job-application-assistant/)
### 🔌 Backend API Server: [https://ai-job-application-backend-intl.onrender.com](https://ai-job-application-backend-intl.onrender.com)

JobAnalyser (AI Job Application Assistant) is a production-ready, full-stack application designed to automate, customize, and optimize job applications. It leverages a state-of-the-art **LangGraph** self-improvement agent loop, a modern **Next.js** frontend, a **FastAPI** backend, and a flexible database layer supporting both local **SQLite** and cloud-hosted **MySQL** (e.g., Aiven.io).

With JobAnalyser, job seekers can tailor resumes, generate high-converting cover letters, compose follow-up emails, test ATS matching scores, and track their applications over time.

---

## 🏗️ System Architecture

JobAnalyser is built using a decoupled, service-oriented architecture:

```mermaid
graph TD
    subgraph Frontend [Client Layer]
        UI[Next.js Single Page App]
    end

    subgraph Backend [Server Layer]
        API[FastAPI Server]
        Core[SQLAlchemy ORM]
        Agent[LangGraph / LangChain Agent]
    end

    subgraph Storage [Data Layer]
        DB[(SQLite / Aiven.io MySQL)]
    end

    subgraph LLM [AI Services]
        Cloud[OpenRouter API]
        Local[Ollama Instance]
    end

    UI <-->|REST API / CORS| API
    API <--> Core
    Core <--> DB
    API <--> Agent
    Agent <-->|Cloud API| Cloud
    Agent <-->|Local Endpoint| Local
```

---

## ✨ Features

* **🤖 LangGraph Self-Improvement Loop**: The agent generates an initial cover letter or resume draft, analyzes it against the job description for gaps, critiques it, and refines it iteratively to ensure the highest possible relevance.
* **💬 Interactive Workspace Chat**: After the initial optimization, users can chat directly with the agent to request revision tweaks (e.g., *"Highlight my SQL database scaling experience"* or *"Make the tone more conversational"*).
* **📊 ATS Scoring & Match Metrics**: Computes matching scores, highlights missing skills, identifies keyword mismatches, and recommends specific improvements for your resume.
* **📁 Master Profile Manager**: Upload and maintain your master resume, experience, background summary, and skills list in one central location.
* **📈 Job Application Tracker & Dashboard**: Track and manage applications throughout their lifecycle (Applied, Interviewing, Offered, Rejected) with real-time visual statistics.
* **🔄 Flexible LLM Provider Switching**: Supports switching between cloud models (via **OpenRouter**, e.g., Llama 3.3 70B) and offline local models (via **Ollama**, e.g., Llama 3.2) with a single `.env` setting.
* **🗄️ Multi-Database Support**: Uses SQLAlchemy to seamlessly transition between local **SQLite** development files and scalable cloud databases (**Aiven.io MySQL**).

---

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Web Backend & AI Agent
│   ├── app/
│   │   ├── api/v1/endpoints/ # API Routers (auth, admin, profile, analyzer, etc.)
│   │   ├── core/             # Database connection & main configurations
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── repositories/     # Data Access Layer
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # Business logic and LangGraph agent execution
│   │   └── main.py           # FastAPI entry point & automatic DB migrations
│   ├── config.py             # LLM provider factory config
│   ├── requirements.txt      # Python dependencies (LangChain, FastAPI, PyMySQL, etc.)
│   └── .env.example          # Sample environment variables for backend
│
├── frontend/                 # Next.js Single Page App Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router & Pages (dashboard, workspace, profile, login)
│   │   └── components/       # Reusable UI component libraries
│   ├── package.json          # Node dependencies (Next.js 16, React 19, Tailwind)
│   └── next.config.ts        # Next.js asset and path routing configurations
│
├── start.sh                  # One-click script to run backend & frontend locally
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

* **Python** (version 3.10 or higher)
* **Node.js** (version 20 or higher) & **npm**
* *(Optional)* **Ollama** (if running models locally)

### 1. Clone & Set Up the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and adjust the keys as needed (see [Environment Configuration](#-environment-configuration) below).

### 2. Set Up the Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

### 3. Run the Application

Return to the project root directory and run the one-click startup script:

```bash
chmod +x start.sh
./start.sh
```

This script spins up:
* The **FastAPI backend** on [http://localhost:8000](http://localhost:8000)
* The **Next.js frontend** on [http://localhost:3000](http://localhost:3000)

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to access the application workspace.

---

## ⚙️ Environment Configuration

Configure these values in your `backend/.env` file:

### LLM Configurations
| Key | Default | Description |
|---|---|---|
| `PROVIDER` | `openrouter` | `openrouter` (cloud; **recommended** — fastest, parallel calls, fits a 512 MB instance), `ollama` (local) or `opencode` ([opencode](https://opencode.ai) CLI/server; locally or in the Docker image). |
| `OPENROUTER_API_KEY` | - | Your API key from [OpenRouter](https://openrouter.ai/). |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3.5-super-vl:free` | Primary cloud model. Use a large model; free slugs change often — check [openrouter.ai/models](https://openrouter.ai/models). |
| `OPENROUTER_FALLBACK_MODELS` | `nvidia/nemotron-3-ultra-550b-a55b:free` | Comma-separated fallbacks, tried in order. Keep these large too — small fallbacks produce garbled resumes. |
| `OPENCODE_MODEL` | *(opencode's default)* | `provider/model` passed to opencode, e.g. `opencode/nemotron-3.5-super-vl-free` (no key needed) or `openrouter/nvidia/nemotron-3.5-super-vl:free` (uses `OPENROUTER_API_KEY`). List yours with `opencode models`. |
| `OPENCODE_VARIANT` | - | *(Optional)* Reasoning effort for models that support it, e.g. `high`. |
| `OPENCODE_SERVER_URL` | - | *(Optional)* URL of a running `opencode serve` (e.g. `http://127.0.0.1:4096`). If unset, `opencode run` is started as a subprocess per call. |
| `OPENCODE_SERVER_USERNAME` / `OPENCODE_SERVER_PASSWORD` | `opencode` / - | Basic-auth credentials for `opencode serve`, if you secured it. |
| `OPENCODE_BIN` / `OPENCODE_TIMEOUT` | `opencode` / `300` | Path to the CLI and per-call timeout in seconds. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Your local Ollama endpoint. |
| `OLLAMA_MODEL` | `llama3.2` | Local model to invoke (ensure you `ollama pull <model>`). |
| `MAX_ITERATIONS` | `1` | Number of critique/self-improvement loops the agent performs. |

#### Using opencode as the LLM
opencode must be installed on the same machine as the backend. Locally:
```bash
opencode models                      # find the provider/model you want
opencode serve --port 4096 &         # optional but faster than spawning the CLI per call
cd backend
PROVIDER=opencode OPENCODE_MODEL=opencode/nemotron-3.5-super-vl-free OPENCODE_VARIANT=high \
OPENCODE_SERVER_URL=http://127.0.0.1:4096 uvicorn app.main:app --port 8000
```
On Render, use the **Docker** runtime: `backend/Dockerfile` installs a pinned opencode release (`OPENCODE_VERSION` build arg). Set `PROVIDER=opencode`, `OPENCODE_MODEL` and `OPENCODE_VARIANT`, and leave `OPENCODE_SERVER_URL` unset. No `opencode auth login` is needed: `opencode/*-free` models need no key, and `openrouter/...` models read `OPENROUTER_API_KEY` from the environment. Limits measured in the Docker image:
* **Memory:** each `opencode run` needs ~750–850 MB and the backend peaked at 1.2–1.4 GB during an analysis. Render's 512 MB instances (Free, Starter) get the process OOM-killed (`opencode exited with -9`); use at least a 2 GB instance. CLI calls are serialised to keep this down (and because parallel runs fail with `database is locked`), so analyses are slower than with `PROVIDER=openrouter`.
* **Free quotas:** `opencode/*-free` models stop with "Free usage limit reached" after a few calls from one machine, and OpenRouter `:free` models allow 50 requests/day per account (1000/day after buying $10 of credits). A shared deployment will hit these quickly.
* opencode adds no model quality of its own: `openrouter/<model>` through opencode is the same model as `PROVIDER=openrouter` with `OPENROUTER_MODEL=<model>`, which needs far less memory.

Tools are disabled for these calls so opencode behaves as a plain text model. If `OPENROUTER_API_KEY` is also set, OpenRouter is used as a fallback when opencode fails.

### LaTeX PDFs
The optimized resume and the cover letter are typeset with LaTeX: the backend parses the current HTML, fills a LaTeX template (all text is escaped) and compiles it with `pdflatex`; the UI previews and downloads that PDF (`POST /api/pdf`, `GET /api/pdf/status`). The recruiter email stays plain text. It needs `texlive-latex-base texlive-latex-recommended texlive-fonts-recommended lmodern` — already installed by `backend/Dockerfile`. If `pdflatex` is missing the UI automatically falls back to the HTML preview and browser-rendered PDF.

### Database & Helpers
| Key | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///agent_memory.db` | Connection string. For MySQL cloud deployment, use: `mysql+pymysql://<user>:<password>@<host>:<port>/<dbname>` |
| `DATABASE_SSL_CA` | - | *(Optional)* Path to the provider's CA certificate PEM. When set, the MySQL server certificate is verified; otherwise `ssl-mode=REQUIRED` gives an encrypted but unverified connection. |
| `JINA_API_KEY` | - | *(Optional)* Key to parse job postings from raw web URLs. |

The backend accepts provider-style URLs as-is, e.g. Aiven's `mysql://user:pass@host:port/defaultdb?ssl-mode=REQUIRED` (it is rewritten to the PyMySQL driver and the `ssl-mode` option is translated). If the database is unreachable the API still starts; `GET /api/health` then reports `{"status": "degraded", "database": "down"}` and database-backed endpoints answer `503` until it is back.

---

## 🚢 Deployment Guide

### Frontend Deployment (GitHub Pages)
The frontend contains a GitHub Actions workflow configured in [deploy.yml](file:///.github/workflows/deploy.yml) that builds and exports static assets to GitHub Pages on every push to `main`. 
* The site calls the backend URL in the repository **variable** `API_URL` (Settings → Secrets and variables → Actions → Variables); without it, it uses the default Render URL in `deploy.yml`. Update it when you move to a new Render service, then re-run the deploy.

### Backend Deployment (Render)
1. Deploy the `backend` folder as a **Web Service** on Render. Choose the **Docker** runtime (uses `backend/Dockerfile`, which installs LaTeX) to get LaTeX PDFs. With the plain **Python** runtime everything works except LaTeX PDFs (the UI falls back to the HTML preview); its start command is:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
   Render cannot change the runtime of an existing service, so for Docker create a new Web Service from the same repo (root directory `backend`) and move the environment variables over.
2. To use opencode there, also set `PROVIDER=opencode`, `OPENCODE_MODEL=opencode/nemotron-3.5-super-vl-free` (or `openrouter/nvidia/nemotron-3.5-super-vl:free`) and `OPENCODE_VARIANT=high` (Docker runtime only).
3. Set your environment variables (like `DATABASE_URL`, `OPENROUTER_API_KEY`, etc.) in the Render dashboard.

### Database Deployment (Aiven.io MySQL)
1. Set up a free MySQL database on [Aiven.io](https://aiven.io/).
2. Fetch the URI connection string from your Aiven project dashboard.
3. Configure the `DATABASE_URL` in your deployed backend environment variables. The backend's PyMySQL connector automatically negotiates SSL encryption out-of-the-box.
