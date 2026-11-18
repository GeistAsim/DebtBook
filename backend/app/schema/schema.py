from typing import Literal
from pydantic import BaseModel, ConfigDict

""" User authetication """

class NewUser(BaseModel):
    username: str
    name: str
    mobile_no: str
    emial: str


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
    

""" Customer """

class NewCustomer(BaseModel):
    name: str
    mobile_no: str | None


""" Transactions """

class Txn(BaseModel):
    customer_id: int
    txn_type: Literal["DEBT", "PAYMENT"]
    amount: int
