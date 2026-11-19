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
    data = data.model_dump()
    try:
        crud = OperationDB()
        result = crud.create_new_user(
            username=data["username"],
            name=data["name"],
            shop_name=data["shop_name"],
            email=data["email"],
            mobile_no=data["mobile_no"],
            password_hash=data["password_hash"]
        )

        if result.rowcount > 0:
            return JSONResponse(status_code=200, content="New User added")
        
        raise HTTPException(
            status_code=400,
            detail=f"User {data['username']} not inserted!!!"
        )
    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        )
