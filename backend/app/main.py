from fastapi import FastAPI, UploadFile, File
import shutil
from app.speech_to_text import convert_audio_to_text

app = FastAPI()

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    transcript = convert_audio_to_text(file_path)

    return {
        "transcript": transcript
    }
