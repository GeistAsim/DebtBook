from typing import Literal
from pydantic import BaseModel, ConfigDict

""" User & Token """

class NewUser(BaseModel):
    username: str
    password: str
    name: str
    business_name: str
    mobile_no: str
    email: str


class User(BaseModel):
    id: int
    username: str
    business_name: str
    mobile_no: str
    email: str


class UserInDB(User):
    password_hash: str


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str
    exp: int

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
