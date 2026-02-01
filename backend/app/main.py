from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
import shutil
import uuid
import os
from sqlalchemy.orm import Session
from app.security import hash_password, verify_password
from app.database import engine, get_db
from app import models
from app.models import User , MOM
from app.dependencies import get_current_user
from app.speech_to_text import convert_audio_to_text
from app.mom_generator import generate_mom
from app.security import verify_password
from app.auth import create_access_token
from app.schemas import UserLogin , UserSignup

app = FastAPI()

UPLOAD_DIR = "temp_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create DB tables
models.Base.metadata.create_all(bind=engine)


@app.get("/")
def health():
    return {"status": "Backend running"}


@app.post("/auth/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email})

    return {
        "message": "User created successfully",
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at
    }


@app.post("/generate-mom/")
async def generate_mom_api(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".mp3", ".wav", ".m4a")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_id = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_id)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        transcript = convert_audio_to_text(file_path)

        if not transcript.strip():
            raise HTTPException(status_code=400, detail="No speech detected")

        mom_text = generate_mom(transcript)

        new_mom = MOM(
            user_id=current_user.id,
            transcript=transcript,
            mom_text=mom_text
        )

        db.add(new_mom)
        db.commit()
        db.refresh(new_mom)

        return {
            "mom_id": new_mom.id,
            "user": current_user.email,
            "mom": mom_text
        }

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)



@app.get("/mom/history")
def get_mom_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    moms = (
        db.query(MOM)
        .filter(MOM.user_id == current_user.id)
        .order_by(MOM.created_at.desc())
        .all()
    )

    return [
        {
            "id": mom.id,
            "created_at": mom.created_at,
            "preview": mom.mom_text[:200]
        }
        for mom in moms
    ]

@app.get("/mom/{mom_id}")
def get_single_mom(
    mom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mom = (
        db.query(MOM)
        .filter(MOM.id == mom_id, MOM.user_id == current_user.id)
        .first()
    )

    if not mom:
        raise HTTPException(status_code=404, detail="MOM not found")

    return {
        "id": mom.id,
        "created_at": mom.created_at,
        "transcript": mom.transcript,
        "mom": mom.mom_text
    }
