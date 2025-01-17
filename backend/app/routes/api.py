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
    filename = os.path.basename(filename)  # remove directory path
    filename = "".join(c for c in filename if c.isalnum() or c in ".-_")
    return filename


def process_file(file_path: str) -> pd.DataFrame:
    """Reads a CSV or Excel file into a pandas DataFrame."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    return df


@router.post("/upload")
async def upload_and_optimize(
    file: UploadFile = File(...),
    unit_cost: float = Form(...),
    price_best: int = Form(...),
    price_max: int = Form(...),
):
    """
    - Uploads a CSV/Excel file containing monthly sales data.
    - Parses the file to compute average monthly volumes (Jan-Dec).
    - Uses a linear demand model from price_best (100% volume) to price_max (0% volume).
      Below price_best => 100% volume; above price_max => 0% volume.
    - Brute-force searches integer prices from max(1, int(unit_cost)) up to price_max
      for the price that yields maximum total profit over 12 months.
    - Returns JSON with:
        * optimal_price
        * total_revenue
        * total_profit
        * monthly_data (month, volume, revenue, profit)
      or a message if no price yields a positive profit.
    """

    # Validate file presence
    if not file:
        raise HTTPException(status_code=400, detail="No file part provided.")
    if file.filename == "":
        raise HTTPException(status_code=400, detail="No selected file.")
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type.")

    # Validate price inputs
    if price_max < price_best:
        raise HTTPException(
            status_code=400, detail="price_max cannot be less than price_best."
        )

    # Save the file to disk (you can skip this if you want in-memory parsing only)
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error writing file to disk: {str(e)}"
        )

    # Parse the file into a DataFrame
    try:
        df = process_file(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    # Ensure we have the expected month columns
    month_cols = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    for col in month_cols:
        if col not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing month column '{col}' in uploaded file.",
            )

    # Calculate average volume per month
    avg_volumes = df[month_cols].mean().tolist()  # 12 floats

    # Linear demand function
    def volume_fraction(p: int) -> float:
        """
        Returns fraction of average volume based on the price p:
        - p < price_best => fraction=1
        - p > price_max => fraction=0
        - otherwise => scale linearly between price_best and price_max
        """
        if p < price_best:
            return 1.0
        elif p > price_max:
            return 0.0
        else:
            return (price_max - p) / float(price_max - price_best)

    # Pre-calculate total average volume
    total_avg_volume = sum(avg_volumes)

    # Optimize search range - no need to check prices below unit_cost
    start_price = max(
        int(unit_cost) + 1, price_best
    )  # Must be above unit_cost to make profit
    end_price = price_max

    # Early exit if no profitable price is possible
    if start_price >= end_price:
        return {
            "profit_flag": "No viable price found for profit",
            "unit_cost": unit_cost,
            "price_best": price_best,
            "price_max": price_max,
        }

    best_profit = float("-inf")
    best_price = None
    best_frac = None  # Store fraction instead of volumes to save memory

    # Optimized search loop
    for p in range(start_price, end_price + 1):
        frac = volume_fraction(p)

        # Early continue if no volume at this price
        if frac == 0:
            continue

        # Calculate profit directly from total volume
        total_volume = frac * total_avg_volume
        total_profit = total_volume * (p - unit_cost)

        if total_profit > best_profit:
            best_profit = total_profit
            best_price = p
            best_frac = frac

    # If no profitable price found
    if best_profit <= 0:
        return {
            "profit_flag": "No viable price found for profit",
            "unit_cost": unit_cost,
            "price_best": price_best,
            "price_max": price_max,
        }

    # Calculate monthly volumes only once for the best price
    best_monthly_volumes = [best_frac * v for v in avg_volumes]

    # Prepare final result
    month_names = month_cols  # just reuse the same list
    monthly_data = []
    for i, volume in enumerate(best_monthly_volumes):
        revenue_i = best_price * volume
        profit_i = (best_price - unit_cost) * volume
        monthly_data.append(
            {
                "month": month_names[i],
                "volume": volume,
                "revenue": revenue_i,
                "profit": profit_i,
            }
        )

    total_volume = sum(best_monthly_volumes)
    total_revenue = best_price * total_volume
    total_profit = best_profit  # already computed

    return {
        "message": "File processed and optimal price calculated successfully.",
        "filename": filename,
        "optimal_price": best_price,
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "monthly_data": monthly_data,
    }


@router.get("/", response_model=Dict[str, str])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    Returns a simple status message.
    """
    return {"status": "healthy", "message": "API is running"}
