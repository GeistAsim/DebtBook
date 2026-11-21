from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.database.db import Base, engine, SessionLocal
from app.database.tables import User, Debtor, Transaction, TxnType

class OperationDB:
    def __init__(self):
        self._conn = SessionLocal()

    def __str__(self):
        return "CRUD operations support for DB"



    """ Helper methods """

    def _is_valid_debtor(self, debtor_id: int, user_id: int):
        """Check debtor is valid for shop owner or not"""
        stmt = (
            select(Debtor).where(
                Debtor.id == debtor_id,
                Debtor.user_id == user_id
            ).with_for_update()
        )

        debtor = self._conn.scalars(stmt).one_or_none()
        if debtor is not None: return debtor

        return None



    """ Write Operation Section """

    # User Section
    def create_new_user(
            self,
            username: str,
            name: str,
            business_name: str,
            email: str,
            mobile_no: str,
            password_hash: str
    ) -> User:
        """Create New User"""
        user = User(
            username=username,
            name=name,
            business_name=business_name,
            email=email,
            mobile_no=mobile_no,
            password_hash=password_hash
        )
        result = self._conn.add(user)
        result = self._conn.commit()
        return result 


    # Debtor Section
    def create_new_debtor(self, user_id: int, name: str, mobile_no: str | None = None) -> Debtor:
        """create new debtor"""
        debtor = Debtor(
            user_id=user_id,
            name=name,
            mobile_no=mobile_no
        )
        self._conn.add(debtor)
        self._conn.commit()
        return debtor


    # Transaction Section
    def new_txn(
            self,
            user_id: int,
            debtor_id: int,
            txn_type: TxnType,
            amount: float,
    ) -> Transaction:
        """Insert a ledger entry and update debtor balance automatically."""
        # check amount
        amount = Decimal(amount)
        if amount < 0: raise ValueError("Amount must be positive!!!")

        debtor = self._is_valid_debtor(debtor_id=debtor_id, user_id=user_id)

        # check debtor is valid for user & exist or not
        if debtor is None: raise LookupError("Debtor not found!!!")

        # check Transaction type
        if txn_type == TxnType.debt:
            debtor.net_balance += amount
        elif txn_type == TxnType.payment:
            debtor.net_balance -= amount
        else:
            raise ValueError("Invalid! transaction type")

        txn = Transaction(
            user_id=user_id,
            debtor_id=debtor_id,
            txn_type=txn_type,
            amount=amount,
            new_balance=debtor.net_balance
        ) 
        self._conn.add(txn) 
        self._conn.commit()
        return txn




    """ Read Operations Section """

    # User Section

    def all_users(self) -> list:
        stmt = (
            select(User).order_by(User.created_at.desc()).with_for_update()
        )
        try:
            users = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching users!!!\n{err}")

        if not users:
            raise HTTPException(
                status_code=404,
                detail="Users not found!!!"
            )

        return users


    def look_user(self, username: str | None = None):
        if username is not None:
            stmt = (
                select(User).where(
                    User.username == username
                ).with_for_update()
            )
        
        elif username is None:
            stmt = (
                select(User).order_by(User.name).with_for_update()
            )
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid!!! Bad Request"
            )

        try:
            user = self._conn.scalars(stmt).one_or_none()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while checking user id: {username}!!!\n{err}")

        # Return None if user not found!!!
        if not user:
            return None

        # Return Requested user only
        if username is not None:
            return user

        # Return all users
        return [user]


    # Debtor Section

    def all_debtors(self) -> list:
        stmt = (
            select(Debtor).with_for_update()
        )
        try:
            debtors = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching debtors!!!\n{err}")

        if not debtors:
            raise HTTPException(
                status_code=404,
                detail="Debtors not found!!!"
            )

        return debtors


    def user_debtors(self, user_id):
        stmt = (
            select(Debtor).where(
                Debtor.user_id == user_id
            ).with_for_update()
        )
        try:
            debtors = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching user debtors!!!\n{err}")

        if not debtors:
            raise HTTPException(
                status_code=404,
                detail="debtors not found!!!"
            )

        return debtors


    # Transaction Section

    def all_txn(self) -> list:
        stmt = (
            select(Transaction).with_for_update()
        )
        try:
            txn = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fethcing transactions!!!\n{err}")

        if not txn:
            raise HTTPException(
                status_code=404,
                detail="Transactions not found!!!"
            )

        return txn


    def user_txn(self, user_id: int, debtor_id: int | None = None):
        if debtor_id is not None:
            stmt = (
                select(Transaction).where(
                    Transaction.user_id == user_id,
                    Transaction.debtor_id == debtor_id
                ).order_by(Transaction.txn_date.desc()).with_for_update()
            )
        else:
            stmt = (
                select(Transaction).where(
                    Transaction.user_id == user_id
                ).order_by(Transaction.txn_date.desc()).with_for_update()
            )
        try:
            txn = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"Database error while fetching user transactions!!!\n{err}")

        if not txn:
            raise HTTPException(
                status_code=404,
                detail="Transactions not found!!!"
            )

        return txn
