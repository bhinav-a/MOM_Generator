from faster_whisper import WhisperModel
from pydub import AudioSegment
import os
import uuid
import subprocess

# 🔥 Load model once
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
def split_audio(audio_path, chunk_length_ms=5 * 60 * 1000):
    """
    Splits audio into chunks (default: 5 minutes)
    Returns list of chunk file paths.
    """
    audio = AudioSegment.from_file(audio_path)
    chunks = []

    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunk_name = f"chunk_{uuid.uuid4().hex}.wav"
        chunk.export(chunk_name, format="wav")
        chunks.append(chunk_name)

    return chunks


def transcribe_long_audio(audio_path):

    wav_path = preprocess_audio(audio_path)
    chunk_files = split_audio(wav_path)
    full_text = ""

    for chunk in chunk_files:
        print(f"Processing {chunk}...")

        segments, _ = model.transcribe(
            chunk,
            beam_size=1,
            vad_filter=True
        )

        for segment in segments:
            full_text += segment.text + " "

        os.remove(chunk)  # cleanup

    return full_text.strip()


# 🔥 Test
text = transcribe_long_audio(r"C:\Users\anura\Downloads\audio15.mp3")
print("\nFINAL TRANSCRIPT:\n")
print(text)