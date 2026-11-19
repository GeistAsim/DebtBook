from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from app.database.crud import OperationDB
from app.model.model import debtor_entitys


get_router = APIRouter()

@get_router.get("/all/debtors")
async def debtors():
    crud = OperationDB()

    try:
        debtor_obj = crud.all_debtors()
        debtors_lst = debtor_entitys(debtor_obj)
        
        if len(debtors_lst) > 0:
            return JSONResponse(status_code=200, content=debtors_lst)
        
        raise HTTPException(
            status_code=404,
            details="Bad Request!!!"
        )

    except HTTPException:
        raise

    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(err)}"
        )
