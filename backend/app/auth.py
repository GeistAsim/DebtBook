import os
import jwt
from dotenv import load_dotenv()
from pwdlib import PasswordHash
from fastapi import Depends, HTTPException, status

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Authentication & Authorization
clss UserAuth:
def __init__(self):
    self.__SECRET_KEY = SECRET_KEY
    self._ALGORITHM = ALGORITHM
    self._ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES

    # hash password instance
    self._password_hashed = PasswordHash.recommended()

    # credentials HTTP Exception
    self.credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not Authorized",
        headers={"WWW-Authenticated": "bearer"}
    )


    # Password Hashing
    def _password_hashing(self, password: str):
        Password_Hashed_Key = self._password_hashed.hash(password)
        return Password_Hashed_Key
