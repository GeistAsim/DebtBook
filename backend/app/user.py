from fastapi import APIRouter
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from app.schema.schema import NewUser
from app.database.db import Base, engine
from app.database.tables import Customer, TxnType, User
from app.database.crud import OperationDB 


# User Authetication & Authorization Router
auth_router = APIRouter()


@auth_router.post("/new/user", response_model=NewUser)
async def new_user(data: NewUser):
    pass
