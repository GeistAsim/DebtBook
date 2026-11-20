import os
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from typing import Annotated
from dotenv import load_dotenv
from pwdlib import PasswordHash
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database.crud import OperationDB
from app.model.model import user_entity, user_entitys
from app.schema.schema import User, UserInDB

load_dotenv()

# Authentication Schema
oauth_schema = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Authentication & Authorization
class UserAuth:
    def __init__(self):
        self.__SECRET_KEY = SECRET_KEY
        self._ALGORITHM = ALGORITHM
        self._ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES

        # Databse Connection
        self._db = OperationDB()

        # hash password instance
        self._password_hash = PasswordHash.recommended()

        # credentials HTTP Exception
        self.credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authorized",
            headers={"WWW-Authenticated": "bearer"}
            )

        # IST time
        self._ist_now = datetime.now(ZoneInfo("Asia/Kolkata"))


    """ Password Section """

    # create hashed password
    def hashed_password(self, password: str) -> str:
        Password_Hashed_Key = self._password_hash.hash(password)
        return Password_Hashed_Key

    # verify password
    def _verify_password(self, plain_password: str, hashed_password: str):
        return self._password_hash.verify(plain_password, hashed_password)


    """ User Section """

    # User Manager
    def _user_manager(self, username: str | None = None):
        try:
            if username is not None:
                # find requested user
                user = self._db.look_user(username)
                if user is not None:
                    user = user_entity(user)
                    return user
            
            elif username is None:
                # list all users
                users = self._db.look_user(username)
                if user is not None and type(user) is list:
                    users = user_entitys(users)
                    return users

        except Exception as err:
            raise HTTPException(
                status_code=500,
                detail=f"Server Error: {err}"
            )


    # is user registered or not?
    def is_registered_user(self, username: str, with_pass: bool = False):
        user = self._user_manager(username)

        if user is None:
            return False

        if with_pass:
            return UserInDB(**user)

        return user
        

    # check user authentication
    def authenticate_user(self, username: str, password: str) -> bool:
        user = self.is_registered_user(username=username, with_pass=True)

        # if user is not registered
        if not user:
            return False
        
        if not self._verify_password(password, user.password_hash):
            return False

        return True


    """ Token Section """

    # New token encoding
    def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()

        if expires_delta:
            expire = self._ist_now + expires_delta

        else:
            expires_delta = self._ist_now + timedelta(minutes=2)

        to_encode.update({"exp": expire})
        encode_jwt = jwt.encode(to_encode, self.__SECRET_KEY, self._ALGORITHM)
        return encode_jwt


    # Decode token
    def decode_token(self, token: Annotated[str, Depends(oauth_schema)]): 
        try:
            payload = jwt.decode(token, self.__SECRET_KEY, alogorithm=[self._ALGORITHM], options={"verify_exp": True})
            username = payload.get("username")
            expiration_time = payload.get("exp")
            return

        except InvalidTokenError as err:
            if isinstance(err, ExpiredSignatureError) or str(err) == "Signature has expired":
                raise HTTPException(
                    status_code=400,
                    detail="Token Expired!!!"
                )
            raise self.credentials_exception
