import enum
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    String, Integer, BigInteger, Numeric
)
from sqlalchemy import (
    ForeignKey, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import Mapped, mapped_column
from app.database.db import Base, BigInt


def ist_now() -> datetime:
    utc_tm = datetime.now(timezone.utc)
    ist_tm = utc_tm + timedelta(hours=5, minutes=30)    
    print(f"utc: {utc_tm}")
    print(f"ist: {ist_tm}")
    return ist_tm

# Transaction Type
class TxnType(str, enum.Enum):
    debt = "DEBT"
    payment = "PAYMENT"


class User(Base):
    """Shop Owner Account"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInt, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    business_name: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    mobile_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=ist_now
    )

    debtor: Mapped[list["Debtor"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"User (user_id={self.id}, business_name={self.business_name}, name={self.name})"



class Debtor(Base):
    """A Shop debtor who buys on credit"""
    __tablename__ = "debtors"

    id: Mapped[int] = mapped_column(BigInt, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInt, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(64), nullable=False)
    mobile_no: Mapped[str | None] = mapped_column(String(20))

    # Amount the debtor currently owes the Shop
    net_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=ist_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=ist_now, onupdate=ist_now
    )

    user: Mapped["User"] = relationship(back_populates="debtor")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="debtor",
        cascade="all, delete-orphan",
        order_by="Transaction.txn_date"
    )


class Transaction(Base):
    """One line transaction statement: either a debt given or payment received"""
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_txn_amount"),
        Index("idx_txn_debtor_date", "debtor_id", "txn_date")
    )

    id: Mapped[int] = mapped_column(BigInt, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInt, ForeignKey("users.id", ondelete="CASCADE")
    )
    debtor_id: Mapped[int] = mapped_column(
        BigInt, ForeignKey("debtors.id", ondelete="CASCADE")
    )

    txn_type: Mapped[TxnType] = mapped_column(SQLEnum(TxnType))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    new_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    txn_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=ist_now
    )

    user: Mapped["User"] = relationship(
        back_populates="transactions"
    )
    debtor: Mapped["Debtor"] = relationship(
        back_populates="transactions"
    )
