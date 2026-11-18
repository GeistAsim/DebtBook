from decimal import Decimal
from fastapi import FastAPI
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from app.schema.schema import Txn
from app.database.db import Base, SessionLocal, engine
from app.database.tables import Customer, TxnType, User
from app.database.crud import OperationDB

app = FastAPI(title="Debt Book")

# Create the tables
Base.metadata.create_all(engine)

# HTTP Exception Error
transaction_exception = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Something wrong with transaction!!!",
    # headers={"WWW-Authonticated": "bearer"}
)


@app.get('/test')
async def test():
    # 2. Open a session and use the functions
    with SessionLocal() as db:
        crud = OperationDB(db)
        # # Add a shop owner
        # crud.create_new_user(
        #     username="asim",
        #     shop_name="Saifi General Store",
        #     name="Asim Saifi",
        #     email="owner@example.com",
        #     mobile_no="9999999999",
        #     password_hash="password",
        # )

        # # Add a customer for that owner
        # crud.create_new_customer(user_id=1, name="Gulsha")

        # Add transactions
        crud.new_txn(user_id=1, customer_id=1, txn_type=TxnType.debt, amount=150)
        # add_transaction(db, user.id, customer.id, TxnType.PAYMENT, Decimal("200"), "Cash")


@app.post("/new/transaction", response_model=Txn)
async def new_txn(data: Txn):
    data = data.model_dump()
    try:
        crud = OperationDB(SessionLocal())
        txn_data = crud.new_txn(user_id=1, customer_id=data["customer_id"], txn_type=data["txn_type"], amount=data["amount"])
        return JSONResponse(status_code=200, content="Transaction Successful")
    except:
        raise transaction_exception
