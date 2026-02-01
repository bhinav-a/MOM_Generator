from sqlalchemy import Column, Integer, String, DateTime , Text , ForeignKey
from datetime import datetime
from app.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MOM(Base):
    __tablename__ = "moms"

    id = Column(Integer , primary_key=True , index=True)
    user_id = Column(Integer , ForeignKey("users.id") , nullable=False)

    transcript = Column(Text , nullable=False)
    mom_text = Column(Text , nullable=False)

    created_at = Column(DateTime , default=datetime.utcnow)

    user = relationship("User" , backref="moms")