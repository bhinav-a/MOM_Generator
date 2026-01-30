import whisper
import re

model = whisper.load_model("medium")

def convert_audio_to_text(audio_path: str) -> str:
    result = model.transcribe(audio_path)
    return clean_transcript(result["text"])



def clean_transcript(text: str) -> str:
    text = text.lower()
    fillers = ["uh", "um", "you know", "like"]
    for f in fillers:
        text = re.sub(rf"\b{f}\b", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()
