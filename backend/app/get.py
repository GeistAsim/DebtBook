from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from app.database.crud import OperationDB
from app.model.model import debtor_entitys, txn_entitys


# Get Router Initialization
get_router = APIRouter()


""" Debtor's details get endpoint """

@get_router.get("/all/debtors")
async def debtors():
    crud = OperationDB()

    try:
        debtor_obj = crud.all_debtors()
        debtors_lst = debtor_entitys(debtor_obj)
        
        if len(debtors_lst) > 0:
            return JSONResponse(status_code=200, content=debtors_lst)
        
        raise HTTPException(
            status_code=400,
            details="Bad Request!!!"
        )

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {str(err)}"
        )


@get_router.get("/user/debtors")
async def debtors_fltr(user_id: int | None = None):
    user_id = user_id if user_id else 1
    crud = OperationDB()

    try:
        debtor_obj = crud.user_debtors(user_id=user_id)
        debtors_lst = debtor_entitys(debtor_obj)

        if len(debtors_lst) > 0:
            return JSONResponse(status_code=200, content=debtors_lst)
        
        raise HTTPException(
            status_code=400,
            detail="Bad Request!!!"
        )

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {err}"
        )


""" Transaction's details endpoint """

@get_router.get("/all/transactions")
async def txn():
    crud = OperationDB()

    try:
        txn_obj = crud.all_txn()
        txn_lst = txn_entitys(txn_obj)

        if len(txn_lst) > 0:
            return JSONResponse(status_code=200, content=txn_lst)

        raise HTTPException(
            status_code=400,
            detail="Bad Request!!!"
        )

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {err}"
        )


@get_router.get("/user/transactions")
async def user_txn_fltr(
    debtor_id: int | None = None
):
    crud = OperationDB()
    user_id = 1

    try:
        if debtor_id is not None:
            txn_obj = crud.user_txn(user_id=user_id, debtor_id=debtor_id)
        else:
            txn_obj = crud.user_txn(user_id=user_id)

        txn_lst = txn_entitys(txn_obj)

        if len(txn_lst) > 0:
            return JSONResponse(status_code=200, content=txn_lst)

        raise HTTPException(
            status_code=400,
            detail="Bad Request!!!"
        )

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server Error: {err}"
        )
