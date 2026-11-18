from fastapi import FastAPI
from decimal import Decimal
# import tables
from app.database.db import Base, SessionLocal, engine
from app.database.tables import Customer, TxnType, User
from app.database.crud import OperationDB

app = FastAPI(title="Debt Book")

# 1. Create the tables (safe to run every time)
Base.metadata.create_all(engine)

@app.get('/')
async def home():
    # 2. Open a session and use the functions
    with SessionLocal() as db:
        crud = OperationDB(db)
        # Add a shop owner
        # crud.create_new_user(
        #     username="asim",
        #     shop_name="Saifi General Store",
        #     owner_name="Asim Saifi",
        #     email="owner@example.com",
        #     mobile_no="9999999999",
        #     password_hash="password",
        # )

        # Add a customer for that owner
        # crud.create_new_customer(user_id=1, name="Gulsha", mobile_no="8888888888")

        # Add transactions
        crud.new_txn(user_id=1, customer_id=1, txn_type=TxnType.payment, amount=300)
        # add_transaction(db, user.id, customer.id, TxnType.PAYMENT, Decimal("200"), "Cash")
