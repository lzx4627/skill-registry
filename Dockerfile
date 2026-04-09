FROM python:3.12-slim

WORKDIR /app

COPY server.py /app/server.py
COPY web /app/web
COPY README.md /app/README.md

EXPOSE 4455

ENV HOST=0.0.0.0
ENV PORT=4455

CMD ["python3", "/app/server.py"]
