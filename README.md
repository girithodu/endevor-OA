# endeavor-OA

A web application with a React frontend and FastAPI backend.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

## Project Structure

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory: cd backend
2. Create a virtual environment (optional but recommended): python -m venv venv
3. Install dependencies: pip install -r requirements.txt
4. Run the FastAPI server: uvicorn app.main:app --reload

The backend will be running at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory: cd frontend
2. Install dependencies: npm install
3. Run the frontend development server: npm run dev

The frontend will be running at `http://localhost:5173`

## Usage

- Open your browser and navigate to `http://localhost:5173`
- Upload a CSV or Excel file with the required format
- Fill in the unit cost, price best, and price max fields
- Click "Submit" to see the results

