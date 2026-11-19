from decimal import Decimal
from fastapi import FastAPI
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from app.schema.schema import Txn, NewCustomer
from app.database.db import Base, engine
from app.database.tables import Customer, TxnType, User
from app.database.crud import OperationDB
from app.user import auth_router
from app.get import get_router

app = FastAPI(title="Debt Book")

# include router
app.include_router(auth_router)
app.include_router(get_router)

# Create the tables
Base.metadata.create_all(engine)

# HTTP Exception Error
data_exception = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Data not being processed!!!",
    # headers={"WWW-Authonticated": "bearer"}
)


@app.post("/new/transaction", response_model=Txn)
async def new_txn(data: Txn):
    data = data.model_dump()
    
    try:
        crud = OperationDB()
        txn = crud.new_txn(user_id=2, customer_id=data["customer_id"], txn_type=data["txn_type"], amount=data["amount"])

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        ) 

    return JSONResponse(status_code=201, content="Transaction Successful")
    

@app.post("/new/customer", response_model=NewCustomer)
async def new_customer(data: NewCustomer):
    data = data.model_dump()

    try:
        crud = OperationDB()
        customer = crud.create_new_customer(user_id=2, name=data["name"], mobile_no=data["mobile_no"] if "mobile_no" in data else None)

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"DataBase error: {str(err)}"
        ) 

    return JSONResponse(status_code=201, content="Customer Inserted Seccussfully")
