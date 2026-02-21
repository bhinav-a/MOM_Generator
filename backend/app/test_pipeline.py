from faster_whisper import WhisperModel
from pydub import AudioSegment
import os
import uuid

# 🔥 Load model once
model = WhisperModel(
    "base",              # faster than small
    device="cpu",
    compute_type="int8",
    cpu_threads=8
)

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
    chunk_files = split_audio(audio_path)
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
text = transcribe_long_audio("meeting.wav")
print("\nFINAL TRANSCRIPT:\n")
print(text)