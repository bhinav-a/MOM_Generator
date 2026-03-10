"""
WebSocket handler for real-time live audio transcription.

Flow:
1. Client connects via WebSocket with JWT token as query param
2. Client sends binary audio chunks (~3 seconds each)
3. Server transcribes each chunk with Whisper and sends partial text back
4. Client sends JSON {"type": "stop"} to finalize
5. Server generates MOM from full transcript and sends it back
"""

import os
import uuid
import json
import tempfile

from fastapi import WebSocket, WebSocketDisconnect, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import SessionLocal
from app.models import User, MOM
from app.speech_to_text import transcribe_chunk
from app.mom_generator import generate_mom

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def authenticate_ws_token(token: str, db: Session):
    """Validate JWT token from WebSocket query param and return user."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
    except JWTError:
        return None

    user = db.query(User).filter(User.email == email).first()
    return user


async def handle_live_transcription(websocket: WebSocket):
    """
    WebSocket endpoint handler for live audio transcription.
    Expects: binary audio chunks, then JSON {"type": "stop"} to finalize.
    Sends back: {"type": "partial", "text": "..."} per chunk,
                {"type": "mom", "mom": "...", "mom_id": N} on stop.
    """
    # --- Auth ---
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = SessionLocal()
    try:
        user = authenticate_ws_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await websocket.accept()

        full_transcript = ""
        temp_files = []

        try:
            while True:
                message = await websocket.receive()

                # --- Binary audio chunk ---
                if "bytes" in message:
                    audio_data = message["bytes"]

                    # Save chunk to temp file
                    chunk_path = os.path.join(
                        tempfile.gettempdir(),
                        f"live_chunk_{uuid.uuid4().hex}.webm"
                    )
                    with open(chunk_path, "wb") as f:
                        f.write(audio_data)
                    temp_files.append(chunk_path)

                    try:
                        # Transcribe this chunk
                        chunk_text = transcribe_chunk(chunk_path)

                        if chunk_text.strip():
                            full_transcript += chunk_text + " "

                            # Send partial transcript back
                            await websocket.send_json({
                                "type": "partial",
                                "text": chunk_text,
                                "full_transcript": full_transcript.strip()
                            })
                    except Exception as e:
                        print(f"Chunk transcription error: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "message": "Failed to transcribe audio chunk"
                        })

                # --- JSON control message ---
                elif "text" in message:
                    try:
                        data = json.loads(message["text"])
                    except json.JSONDecodeError:
                        continue

                    if data.get("type") == "stop":
                        # Generate MOM from full transcript
                        if not full_transcript.strip():
                            await websocket.send_json({
                                "type": "error",
                                "message": "No speech detected during recording"
                            })
                            break

                        await websocket.send_json({
                            "type": "status",
                            "message": "Generating meeting minutes..."
                        })

                        try:
                            mom_text = generate_mom(full_transcript.strip())

                            # Save to DB
                            new_mom = MOM(
                                user_id=user.id,
                                transcript=full_transcript.strip(),
                                mom_text=mom_text,
                                source="live"
                            )
                            db.add(new_mom)
                            db.commit()
                            db.refresh(new_mom)

                            await websocket.send_json({
                                "type": "mom",
                                "mom": mom_text,
                                "mom_id": new_mom.id,
                                "transcript": full_transcript.strip()
                            })
                        except Exception as e:
                            print(f"MOM generation error: {e}")
                            await websocket.send_json({
                                "type": "error",
                                "message": "Failed to generate meeting minutes"
                            })

                        break

        except WebSocketDisconnect:
            print("Client disconnected during live transcription")

        finally:
            # Cleanup temp files
            for f in temp_files:
                try:
                    if os.path.exists(f):
                        os.remove(f)
                except OSError:
                    pass

    finally:
        db.close()
