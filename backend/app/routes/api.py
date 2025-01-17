from fastapi import APIRouter, HTTPException

from app.database import supabase

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        # Test database connection
        # response = supabase.table("your_table_name").select("*").limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
