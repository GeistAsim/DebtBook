from typing import Annotated
from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from app.auth import UserAuth
import jwt
from app.schema.schema import NewUser, User, Token
from app.database.db import Base, engine
from app.database.crud import OperationDB 
from app.model.model import user_entitys


# User Authetication Object
auth = UserAuth()


# User Authetication & Authorization Router
auth_router = APIRouter(dependencies=[Depends(auth.get_current_user)])

# Public Routes
public_router = APIRouter()


""" Token Section """

# User Credentails
@auth_router.get("/current/user")
def current_user(user: Annotated[User, Depends(auth.get_current_user)]):
    return JSONResponse(status_code=200, content=user.model_dump())


@public_router.post("/user/login")
async def user_login(login_credentials: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user_token = auth.authenticate_user(username=login_credentials.username, password=login_credentials.password)
    
    # if User Credentails not True
    if not user_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
 
    return user_token


""" User Section """

# new user registration
@public_router.post("/new/user", response_model=NewUser)
async def new_user(data: NewUser):
    if auth.is_registered_user(data.username):
        raise HTTPException(
            status_code=409,
            detail="Pick Another Username!!!"
        )

    data = data.model_dump()
    crud = OperationDB()
    try:
        # create hashed password
        password_hash = auth.hashed_password(data["password"])

        # insert user
        result = crud.create_new_user(
            username=data["username"],
            name=data["name"],
            business_name=data["business_name"],
            email=data["email"],
            mobile_no=data["mobile_no"],
            password_hash=password_hash
        )

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        ) 

    return JSONResponse(status_code=201, content="User Inserted Seccussfully")


@auth_router.get("/users")
async def users_lst():
    crud = OperationDB()
    try:
        user_objs = crud.all_users()
        user_lst = user_entitys(user_objs)
        if len(user_lst) > 0:
            return JSONResponse(status_code=200, content=user_lst)

        raise HTTPException(
            status_code=400,
            detail="Bad Request!!!"
        )

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {str(err)}"
        )
