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
from app.schema.schema import User, UserInDB, Token

load_dotenv()

# Authentication Schema
oauth_schema = OAuth2PasswordBearer(tokenUrl="user/login")

# Token Secrets
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Authentication & Authorization
class UserAuth:
    def __init__(self):
        self.__SECRET_KEY = SECRET_KEY
        self._ALGORITHM = ALGORITHM
        self._ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES

        # hash password instance
        self._password_hash = PasswordHash.recommended()

        # credentials HTTP Exception
        self.credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authorized",
            headers={"WWW-Authenticated": "bearer"}
            )

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
        db = OperationDB()
        try:
            if username is not None:
                # find requested user
                user = db.look_user(username)
                if user is not None:
                    user = user_entity(user)
                    return user
            
            elif username is None:
                # list all users
                users = db.look_user(username)
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

        return User(**user)
        

    # check user authentication
    def authenticate_user(self, username: str, password: str):
        user = self.is_registered_user(username=username, with_pass=True)

        # if user is not registered
        if not user:
            return False
        
        if not self._verify_password(password, user.password_hash):
            return False

        token_data = {
            "username": user.username
        }

        access_token = self._create_access_token(
            data=token_data,
            expires_delta_min=self._ACCESS_TOKEN_EXPIRE_MINUTES
        )
        return Token(
            access_token=access_token,
            token_type='bearer'
        )


    """ Token Handling Section """

    # New token encoding
    def _create_access_token(self, data: dict, expires_delta_min: int | None = None):
        to_encode = data.copy()

        if expires_delta_min:
            expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta_min)

        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=2)

        to_encode.update({"exp": expire})
        encode_jwt = jwt.encode(to_encode, self.__SECRET_KEY, self._ALGORITHM)
        return encode_jwt


    # Decode token
    def _decode_token(self, token: Annotated[str, Depends(oauth_schema)]): 
        try:
            payload = jwt.decode(token, self.__SECRET_KEY, algorithms=[self._ALGORITHM], options={"verify_exp": True})
            return payload

        except InvalidTokenError as err:
            if isinstance(err, ExpiredSignatureError) or str(err) == "Signature has expired":
                raise HTTPException(
                    status_code=400,
                    detail="Token Expired!!!"
                )
            raise self.credentials_exception


    """ Token scanning """

    # get current user
    def get_current_user(self, token: Annotated[str, Depends(oauth_schema)]):
        try:
            payload = self._decode_token(token=token)
            username = payload["username"]

            if username is None:
                raise self.credentials_exception

            user = self.is_registered_user(username=username)

            if not user:
                raise self.credentials_exception

            return user
             
        except InvalidTokenError as err:
            if isinstance(err, ExpiredSignatureError) or str(err) == "Signature has expired":
                raise HTTPException(
                    status_code=400,
                    detail="Token Expired!!!"
                )
            
            raise self.credentials_exception
