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

    try:
        # Force IPv4 to avoid "Network is unreachable" if container lacks IPv6
        import socket
        old_getaddrinfo = socket.getaddrinfo
        def new_getaddrinfo(*args, **kwargs):
            return old_getaddrinfo(args[0], args[1], socket.AF_INET, *args[3:], **kwargs)
        socket.getaddrinfo = new_getaddrinfo

        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            if os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASS"):
                smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            else:
                print("⚠️ EMAIL_USER or EMAIL_PASS not fully set in environment.")
            smtp.send_message(msg)
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise
