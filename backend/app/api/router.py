from fastapi import APIRouter


router = APIRouter(
    tags=["system"]
)

@router.get("/ping")
def ping():
    return {"status": "ok"}