FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/output && chown -R 1000:1000 /app/output
RUN useradd -m -u 1000 appuser
USER appuser
CMD ["python", "app.py"]