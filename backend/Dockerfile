FROM python:3.10-slim

WORKDIR /app

# Copy dependency definition
COPY requirements.txt .

# Install dependencies without cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose FastAPI internal port
EXPOSE 8080

# Run server on port 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
