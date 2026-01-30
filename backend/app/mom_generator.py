import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from speech_to_text import convert_audio_to_text
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
chat = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    api_key=api_key # Your API key
)

prompt = PromptTemplate(
    template="""
You are a professional assistant that generates Minutes of Meeting (MOM).

From the meeting transcript below, create a well-structured MOM with:

1. Meeting Summary
2. Key Discussion Points
3. Decisions Made
4. Action Items (mention owner if available)

Transcript:
\"\"\"
{transcript}
\"\"\"
""",
input_variables=['transcript']
)

parser = StrOutputParser()

def generate_mom(transcript: str) -> str:
    chain = prompt | chat | parser
    response = chain.invoke({"transcript": transcript})
    return response

# text = convert_audio_to_text("D:\Record (online-voice-recorder.com).mp3")
# result = generate_mom(text)

# print(result)