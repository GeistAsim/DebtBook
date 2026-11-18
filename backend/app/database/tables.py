import enum
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
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


def utc_now():
    return datetime.now(ZoneInfo("Asia/Kolkata"))


class TxnType(str, enum.Enum):
    debt = "DEBT"
    payment = "PAYMENT"


class User(Base):
    """Shop Owner Account"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInt, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    shop_name: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    mobile_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now()
    )

    customer: Mapped[list["Customer"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"User (user_id={self.user_id}, shop_name={self.shop_name}, user_name={self.user_name})"



class Customer(Base):
    """A Shop customer who buys on credit"""
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(BigInt, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInt, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(64), nullable=False)
    mobile_no: Mapped[str | None] = mapped_column(String(20))

    # Amount the customer currently owes the Shop
    net_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now(), onupdate=utc_now()
    )

    user: Mapped["User"] = relationship(back_populates="customer")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="customer",
        cascade="all, delete-orphan",
        order_by="Transaction.txn_date"
    )


class Transaction(Base):
    """One line transaction statement: either a debt given or payment received"""
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_txn_amount"),
        Index("idx_txn_customer_date", "customer_id", "txn_date")
    )

    id: Mapped[int] = mapped_column(BigInt, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInt, ForeignKey("users.id", ondelete="CASCADE")
    )
    customer_id: Mapped[int] = mapped_column(
        BigInt, ForeignKey("customers.id", ondelete="CASCADE")
    )

    txn_type: Mapped[TxnType] = mapped_column(SQLEnum(TxnType))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    new_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    txn_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now()
    )

    user: Mapped["User"] = relationship(
        back_populates="transactions"
    )
    customer: Mapped["Customer"] = relationship(
        back_populates="transactions"
    )
