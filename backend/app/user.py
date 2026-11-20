from fastapi import APIRouter
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from app.auth import UserAuth
from app.schema.schema import NewUser
from app.database.db import Base, engine
from app.database.tables import User
from app.database.crud import OperationDB 
from app.model.model import user_entitys


# User Authetication & Authorization Router
auth_router = APIRouter()


# User Authetication Object
auth = UserAuth()


@auth_router.post("/new/user", response_model=NewUser)
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
