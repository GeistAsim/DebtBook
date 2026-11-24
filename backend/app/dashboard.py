from typing import Annotated
from fastapi import APIRouter
from fastapi import Depends, HTTPException
from fastapi.responses import JSONResponse
from app.database.crud import OperationDB
from app.schema.schema import User
from app.auth import UserAuth


# User Authentication
auth = UserAuth()

# Get Router Initialization
dashboard_router = APIRouter()


@dashboard_router.get("/dashboard")
async def dashboard(user: Annotated[User, Depends(auth.get_current_user)]):
    crud = OperationDB()

    try:
        outstanding = crud.outstanding_credits(user_id=user.id)
        payment = crud.monthly_txn(user_id=user.id, txn_type="payment")
        credit = crud.monthly_txn(user_id=user.id, txn_type="debt")
        count = crud.count_debtor(user_id=user.id)
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {err}"
        )

    dashboard_data = {
        "outstanding": round(float(outstanding), 2),
        "payment": round(float(payment), 2),
        "credit": round(float(credit), 2),
        "debtor_count": count
    }

    return JSONResponse(status_code=200, content=dashboard_data)
