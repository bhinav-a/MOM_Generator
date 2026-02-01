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
prompt = ChatPromptTemplate.from_template("""
You are a professional assistant that generates clear and concise
Minutes of Meeting (MOM).

From the meeting transcript below, create a well-structured MOM with
the following sections:

1. Meeting Summary
2. Key Discussion Points (bullet points)
3. Decisions Made
4. Action Items (mention owner if available)

Transcript:
\"\"\"
{transcript}
\"\"\"

Write in professional, clear English.
""")

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
