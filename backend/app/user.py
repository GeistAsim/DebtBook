from fastapi import APIRouter
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from app.schema.schema import NewUser
from app.database.db import Base, engine
from app.database.tables import User
from app.database.crud import OperationDB 
from app.model.model import user_entitys


# User Authetication & Authorization Router
auth_router = APIRouter()


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


@auth_router.post("/new/user", response_model=NewUser)
async def new_user(data: NewUser):
    data = data.model_dump()
    try:
        crud = OperationDB()
        result = crud.create_new_user(
            username=data["username"],
            name=data["name"],
            business_name=data["business_name"],
            email=data["email"],
            mobile_no=data["mobile_no"],
            password_hash=data["password_hash"]
        )

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        ) 

    return JSONResponse(status_code=201, content="User Inserted Seccussfully")
