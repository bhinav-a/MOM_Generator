from faster_whisper import WhisperModel
from pydub import AudioSegment
import re
import subprocess
import uuid
import os

# ✅ Optimized model for CPU
model = WhisperModel(
    "base",              # faster than small
    device="cpu",
    compute_type="int8",
    cpu_threads=8
)


def preprocess_audio(input_path: str) -> str:
    """
    Converts audio to 16kHz mono WAV
    """
    output_path = f"temp_{uuid.uuid4().hex}.wav"

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            output_path
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    return output_path


def split_audio(audio_path: str, chunk_length_ms=5 * 60 * 1000):
    """
    Split audio into 5-minute chunks (default)
    """
    audio = AudioSegment.from_file(audio_path)
    chunks = []

    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunk_name = f"chunk_{uuid.uuid4().hex}.wav"
        chunk.export(chunk_name, format="wav")
        chunks.append(chunk_name)

    return chunks


def convert_audio_to_text(audio_path: str) -> str:
    """
    Transcribes long audio using chunking
    """
    wav_path = preprocess_audio(audio_path)
    chunk_files = split_audio(wav_path)

    full_text = ""

    for chunk in chunk_files:
        segments, _ = model.transcribe(
            chunk,
            beam_size=1,
            vad_filter=True
        )

        for segment in segments:
            full_text += segment.text + " "

        os.remove(chunk)  # cleanup chunk

    os.remove(wav_path)  # cleanup preprocessed file

    return clean_transcript(full_text)


def clean_transcript(text: str) -> str:
    text = text.lower()
    fillers = ["uh", "um", "you know", "like"]
    for f in fillers:
        text = re.sub(rf"\b{f}\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()