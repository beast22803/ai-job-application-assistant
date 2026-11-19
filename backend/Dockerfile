FROM python:3.10-slim

WORKDIR /app

# LaTeX toolchain used to typeset the resume / cover letter PDFs (see app/services/latex_pdf.py)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        texlive-latex-base texlive-latex-recommended texlive-fonts-recommended lmodern \
    && rm -rf /var/lib/apt/lists/*

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
