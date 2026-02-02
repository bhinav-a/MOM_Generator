import random
import hashlib
from datetime import datetime, timedelta

def generate_otp():
    return str(random.randint(100000, 999999))

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

def get_expiry(minutes=5):
    return datetime.utcnow() + timedelta(minutes=minutes)
