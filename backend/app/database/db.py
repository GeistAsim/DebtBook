import os
from dotenv import load_dotenv
from sqlalchemy import BigInteger, Integer
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

class Base(DeclarativeBase):
    pass

# BigInt varient for sqlite
BigInt = BigInteger().with_variant(Integer, "sqlite")

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

def conn_db():
    """FastAPI dependency: one session per request"""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
