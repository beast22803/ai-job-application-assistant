FROM python:3.10-slim

WORKDIR /app

# LaTeX toolchain used to typeset the resume / cover letter PDFs (see app/services/latex_pdf.py)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        texlive-latex-base texlive-latex-recommended texlive-fonts-recommended lmodern \
    && rm -rf /var/lib/apt/lists/*

# opencode CLI, used when PROVIDER=opencode (see app/core/opencode_llm.py).
# A pinned release binary; the x64 "baseline" build runs on any x86-64 CPU.
ARG OPENCODE_VERSION=1.19.2
ARG TARGETARCH
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && case "${TARGETARCH:-amd64}" in \
         arm64) oc_target=linux-arm64 ;; \
         *)     oc_target=linux-x64-baseline ;; \
       esac \
    && curl -fsSL "https://github.com/anomalyco/opencode/releases/download/v${OPENCODE_VERSION}/opencode-${oc_target}.tar.gz" \
       | tar -xz -C /usr/local/bin opencode \
    && chmod +x /usr/local/bin/opencode \
    && opencode --version \
    && apt-get purge -y curl && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*
# opencode keeps its state under $HOME; give it a writable one.
ENV HOME=/tmp/opencode-home

# Copy dependency definition
COPY requirements.txt .

# Install dependencies without cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose FastAPI internal port
EXPOSE 8080

# Run server on $PORT (Render sets it) or 8080 (Fly / local)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
