import whisper
import re
import subprocess
import uuid
import os

# ✅ Use SMALL model (best speed vs accuracy on CPU)
model = whisper.load_model("small")

def preprocess_audio(input_path: str) -> str:
    """
    Converts audio to 16kHz mono WAV (best format for Whisper)
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


def convert_audio_to_text(audio_path: str) -> str:
    wav_path = preprocess_audio(audio_path)

    result = model.transcribe(
        wav_path,
        language="en",
        fp16=False,      # CPU-safe
        beam_size=1,     # faster decoding
        verbose=False
    )

    os.remove(wav_path)  # cleanup temp file

    return clean_transcript(result["text"])


def clean_transcript(text: str) -> str:
    text = text.lower()
    fillers = ["uh", "um", "you know", "like"]
    for f in fillers:
        text = re.sub(rf"\b{f}\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()
