import os
from pathlib import Path
from typing import Dict, Optional

import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

router = APIRouter()

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def secure_filename(filename: str) -> str:
    """
    Sanitize the filename for safe storage.
    """
    # Get only the filename without path
    filename = os.path.basename(filename)
    # Remove any characters that aren't alphanumeric, dash, underscore, or dot
    filename = "".join(c for c in filename if c.isalnum() or c in ".-_")
    return filename


def process_file(file_path: str) -> pd.DataFrame:
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    return df


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    field1: Optional[str] = Form(None),
    field2: Optional[str] = Form(None),
):
    if not file:
        raise HTTPException(status_code=400, detail="No file part")

    if file.filename == "":
        raise HTTPException(status_code=400, detail="No selected file")

    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")

    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Save the file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Process the file
        df = process_file(file_path)

        return {
            "message": "File processed successfully",
            "filename": filename,
            "preview": df.head().to_dict(),
            "field1": field1,
            "field2": field2,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=Dict[str, str])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    Returns a simple status message.
    """
    return {"status": "healthy", "message": "API is running"}
