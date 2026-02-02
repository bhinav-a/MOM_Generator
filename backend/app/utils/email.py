import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv
load_dotenv()

def send_otp_email(to_email: str, otp: str):
    msg = EmailMessage()
    msg["Subject"] = "Your Signup OTP"
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = to_email
    msg.set_content(
        f"Your OTP for signup is {otp}. It is valid for 5 minutes."
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
        smtp.send_message(msg)
