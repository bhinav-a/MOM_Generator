# 🎙️ AI-Powered Minutes of Meeting (MOM) Generator

An end-to-end **AI-powered application** that converts meeting audio into **professional Minutes of Meeting (MOM)** using **Speech-to-Text** and **Generative AI**.

This project automates the entire workflow:
**Audio → Transcript → Structured MOM**

---

## 🚀 Features

- 🎤 Upload meeting audio (`.wav`, `.mp3`)
- 🧠 Speech-to-Text using **OpenAI Whisper (local)**
- 🧹 Transcript cleaning (removes fillers like *uh, um*)
- ✍️ MOM generation using **LangChain + Gemini LLM**
- 📄 Structured output:
  - Meeting Summary
  - Key Discussion Points
  - Decisions Made
  - Action Items
- 🔐 Secure API key handling with `.env`
- 📦 REST API built using **FastAPI**

---

## 🛠️ Tech Stack

| Component | Technology |
|--------|-----------|
| Backend | FastAPI |
| Speech-to-Text | OpenAI Whisper (local) |
| LLM | Google Gemini |
| LLM Orchestration | LangChain |
| Language | Python 3.10 |
| Audio Processing | FFmpeg |
| Environment Management | python-dotenv |

---


