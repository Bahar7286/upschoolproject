FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY app ./app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN mkdir -p /app/uploads/licenses

ENV PYTHONUNBUFFERED=1
ENV UPLOAD_DIR=/app/uploads

# Render sets PORT (often 10000); default 8000 for local docker run
EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
