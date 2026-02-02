import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Load environment variables
load_dotenv()

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY"),
)

# Prompt template (chat-optimized)
prompt = ChatPromptTemplate.from_template(
    """
You are an expert professional assistant that generates accurate and
reliable Minutes of Meeting (MOM).

First, analyze the transcript and decide whether it represents a real
meeting discussion (e.g., involves agenda, discussion, decisions,
planning, or coordination among participants).

RULES:
- If the transcript is NOT a meeting (e.g., random speech, self-introduction,
casual talk, nonsense, or unrelated audio), respond ONLY with:
  "The provided audio does not appear to be a meeting discussion, so
   Minutes of Meeting cannot be generated."

- If it IS a meeting, generate a MOM using ONLY the information that
is clearly present in the transcript.
- Do NOT invent, assume, or infer details that are not explicitly stated.
- Do NOT include any section for which there is no relevant information.
- Do NOT leave any section blank.

When applicable, use the following sections (include only those that apply):

• Meeting Summary  
• Key Discussion Points (use bullet points)  
• Decisions Made  
• Action Items (include owner names if mentioned)

Transcript:
{transcript}

Write in clear, concise, professional English.
"""
)

# Output parser
parser = StrOutputParser()

def generate_mom(transcript: str) -> str:
    """
    Generates Minutes of Meeting from a cleaned transcript.
    """
    if not transcript or len(transcript.strip()) < 20:
        return "Transcript is too short or empty to generate MOM."

    chain = prompt | llm | parser
    return chain.invoke({"transcript": transcript})
