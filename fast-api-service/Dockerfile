FROM python:3.11-slim

WORKDIR /app

ENV PYTHONPATH=/app:/app/services
ENV APP_BASE_DIR=/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "main:app", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--log-level", "debug"]
