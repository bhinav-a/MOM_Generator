# Backend Dockerfile for MinuteX
# Uses multi-stage build to keep the final image smaller

FROM python:3.10-slim-bookworm

# Install FFmpeg (required for audio conversion)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper model during build (so it doesn't download at runtime)
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"

# Copy application code
COPY app/ ./app/

# Create temp_audio directory
RUN mkdir -p temp_audio

# Expose port
EXPOSE 8000

# Start the server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
