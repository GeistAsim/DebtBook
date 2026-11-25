import calendar
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select, func
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

    def conn_close(self):
        return self._conn.close()


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


    def _month_period(self) -> dict:
        utc_time = datetime.now(timezone.utc)
        ist_time = utc_time + timedelta(hours=5, minutes=30)

        month_start = ist_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        _, days = calendar.monthrange(month_start.year, month_start.month)
        month_end = ist_time.replace(day=days, hour=23, minute=59, second=59, microsecond=999999)

        return {
            "start": month_start,
            "end": month_end
        }



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
        result = self._conn.refresh(user)
        self._conn.close()
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
        self._conn.refresh(debtor)
        self._conn.close()
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
        if amount <= 0: raise ValueError("Amount must be positive!!!")

        debtor = self._is_valid_debtor(debtor_id=debtor_id, user_id=user_id)

        # check debtor is valid for user & exist or not
        if debtor is None: raise LookupError("Debtor not found!!!")

        # check Transaction type
        if txn_type == TxnType.debt:
            debtor.net_balance += amount
        elif txn_type == TxnType.payment:
            if debtor.net_balance < amount:
                raise ValueError("Payment exceeds current debtor balance!!!")
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
        self._conn.refresh(txn)
        self._conn.close()
        return txn




    """ Read Operations Section """

    # User Section

    def all_users(self) -> list:
        stmt = (
            select(User).order_by(User.created_at.desc())
        )
        try:
            users = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching users!!!\n{err}")
        finally:
            self._conn.close()

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
                )
            )
        
        elif username is None:
            stmt = (
                select(User).order_by(User.name)
            )
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid!!! Bad Request"
            )

        try:
            if username is not None:
                user = self._conn.scalars(stmt).one_or_none()
            else:
                user = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while checking user id: {username}!!!\n{err}")
        finally:
            self._conn.close()

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
            select(Debtor)
        )
        try:
            debtors = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching debtors!!!\n{err}")
        finally:
            self._conn.close()

        if not debtors:
            raise HTTPException(
                status_code=404,
                detail="Debtors not found!!!"
            )

        return debtors


    def user_debtors(self, user_id: int, debtor_id: int | None = None):
        if debtor_id is None:
            stmt = (
                select(Debtor).where(
                    Debtor.user_id == user_id
                )
            )
        else:
            stmt = (
                select(Debtor).where(
                    Debtor.id == debtor_id,
                    Debtor.user_id == user_id
                )
            )
        try:
            debtors = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching user debtors!!!\n{err}")
        finally:
            self._conn.close()

        if not debtors:
            raise HTTPException(
                status_code=404,
                detail="debtors not found!!!"
            )

        return debtors


    def outstanding_credits(self, user_id: int):
        stmt = (
            select(func.sum(Debtor.net_balance)).where(
                Debtor.user_id == user_id
            )
        )
        try:
            credit = self._conn.scalars(stmt).one_or_none()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching user credits!!!\n{err}")
        finally:
            self._conn.close()

        if not credit:
            raise HTTPException(
                status_code=404,
                detail="Credits not found!!!"
            )

        return credit


    def count_debtor(self, user_id: int):
        stmt = (
            select(func.count(Debtor.id)).where(
                Debtor.user_id == user_id
            )
        )
        try:
            debtor = self._conn.scalars(stmt).one_or_none()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching debtor counts!!!\n{err}")
        finally:
            self._conn.close()

        if not debtor:
            raise HTTPException(
                status_code=404,
                detail="Debtor count not found!!!"
            )

        return debtor


    # Transaction Section

    def all_txn(self) -> list:
        stmt = (
            select(Transaction)
        )
        try:
            txn = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fethcing transactions!!!\n{err}")
        finally:
            self._conn.close()

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
                ).order_by(Transaction.txn_date.desc())
            )
        else:
            stmt = (
                select(Transaction).where(
                    Transaction.user_id == user_id
                ).order_by(Transaction.txn_date.desc())
            )
        try:
            txn = self._conn.scalars(stmt).all()
        except SQLAlchemyError as err:
            raise RuntimeError(f"Database error while fetching user transactions!!!\n{err}")
        finally:
            self._conn.close()

        if not txn:
            raise HTTPException(
                status_code=404,
                detail="Transactions not found!!!"
            )

        return txn


    def monthly_txn(self, user_id: int, txn_type: TxnType):
        if isinstance(txn_type, str):
            txn_type = txn_type.upper()
            try:
                txn_type = TxnType(txn_type)
            except ValueError as err:
                valid_types = [t.value for t in TxnType]
                raise ValueError(f"Invalid txn_type {txn_type}. Must be one of {valid_types}")

        period = self._month_period()

        stmt = (
            select(
                func.sum(Transaction.amount)
            ).where(
                Transaction.user_id == user_id,
                Transaction.txn_type == txn_type,
                Transaction.txn_date.between(period["start"], period["end"])
            )
        )
        try:
            txn = self._conn.scalars(stmt).one_or_none()
        except SQLAlchemyError as err:
            raise RuntimeError(f"DataBase error while fetching month_credits!!!\n{err}")
        finally:
            self._conn.close()

        if not txn:
            raise HTTPException(
                status_code=404,
                detail="dashboard not found!!!"
            )

        return txn
