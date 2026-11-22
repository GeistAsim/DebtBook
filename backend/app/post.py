from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from app.database.crud import OperationDB
from app.schema.schema import NewDebtor, Txn
from app.auth import UserAuth


# User authentication
auth = UserAuth()

# Post router intiliazation
post_router = APIRouter(dependencies=[Depends(auth.get_current_user)])

# HTTP Exception Error
data_exception = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Data not being processed!!!",
    # headers={"WWW-Authonticated": "bearer"}
)


@post_router.post("/new/transaction", response_model=Txn)
async def new_txn(data: Txn):
    data = data.model_dump()
    
    try:
        crud = OperationDB()
        txn = crud.new_txn(user_id=1, debtor_id=data["debtor_id"], txn_type=data["txn_type"], amount=data["amount"])

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        ) 

    return JSONResponse(status_code=201, content="Transaction Successful")
    

@post_router.post("/new/debtor", response_model=NewDebtor)
async def new_debtor(data: NewDebtor):
    data = data.model_dump()

    try:
        crud = OperationDB()
        debtor = crud.create_new_debtor(user_id=1, name=data["name"], mobile_no=data["mobile_no"] if "mobile_no" in data else None)

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        ) 

    return JSONResponse(status_code=201, content="Debtor Inserted Seccussfully")
