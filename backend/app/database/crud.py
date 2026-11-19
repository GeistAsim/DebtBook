from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.database.db import Base, engine, SessionLocal
from app.database.tables import User, Customer, Transaction, TxnType

class OperationDB:
    def __init__(self):
        self._conn = SessionLocal()

    def __str__(self):
        return "CRUD operations support for DB"


    def _is_valid_customer(self, customer_id: int, user_id: int):
        """Check customer is valid for shop owner or not"""
        stmt = (
            select(Customer).where(
                Customer.id == customer_id,
                Customer.user_id == user_id
            ).with_for_update()
        )

        customer = self._conn.scalars(stmt).one_or_none()
        if customer is not None: return customer

        return None


    def create_new_user(
            self,
            username: str,
            name: str,
            shop_name: str,
            email: str,
            mobile_no: str,
            password_hash: str
    ) -> User:
        """Create New User"""
        user = User(
            username=username,
            name=name,
            shop_name=shop_name,
            email=email,
            mobile_no=mobile_no,
            password_hash=password_hash
        )
        result = self._conn.add(user)
        result = self._conn.commit()
        return result


    def create_new_customer(self, user_id: int, name: str, mobile_no: str | None = None) -> Customer:
        """create new customer"""
        customer = Customer(
            user_id=user_id,
            name=name,
            mobile_no=mobile_no
        )
        self._conn.add(customer)
        self._conn.commit()
        return customer

    def new_txn(
            self,
            user_id: int,
            customer_id: int,
            txn_type: TxnType,
            amount: Decimal,
    ) -> Transaction:
        """Insert a ledger entry and update customer balance automatically."""
        # check amount
        amount = Decimal(amount)
        if amount < 0: raise ValueError("Amount must be positive!!!")

        customer = self._is_valid_customer(customer_id=customer_id, user_id=user_id)

        # check customer is valid for user & exist or not
        if customer is None: raise LookupError("Customer not found!!!")

        # check Transaction type
        if txn_type == TxnType.debt:
            customer.net_balance += amount
        elif txn_type == TxnType.payment:
            customer.net_balance -= amount
        else:
            raise ValueError("Invalid! transaction type")

        txn = Transaction(
            user_id=user_id,
            customer_id=customer_id,
            txn_type=txn_type,
            amount=amount,
            new_balance=customer.net_balance
        ) 
        self._conn.add(txn) 
        self._conn.commit()
        return txn


    def all_users(self) -> list:
        stmt = (
            select(User).with_for_update()
        )
        try:
            users = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching users!!!\t{err}")

        if not users:
            raise HTTPException(
                status_code=404,
                detail="User not found!!!"
            )

        return users
