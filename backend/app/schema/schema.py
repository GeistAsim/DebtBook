from typing import Literal
from pydantic import BaseModel, ConfigDict

""" User & authetication """

class NewUser(BaseModel):
    username: str
    password_hash: str
    name: str
    business_name: str
    mobile_no: str
    email: str


class User(BaseModel):
    user_id: int
    username: str
    mobile_no: str
    email: str

class UserInDB(BaseModel):
    password_hash: str


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: int | None = None
    username: str | None = None

class NewTokenData(BaseModel):
    username: str
    token: str | None = None
    

""" Debtor """

class NewDebtor(BaseModel):
    name: str
    mobile_no: str | None = None


""" Transactions """

class Txn(BaseModel):
    debtor_id: int
    txn_type: Literal["DEBT", "PAYMENT"]
    amount: float
