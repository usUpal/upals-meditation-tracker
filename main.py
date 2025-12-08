import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, validator
from pymongo import MongoClient
from starlette.middleware.base import BaseHTTPMiddleware

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.environ.get("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is required")
DATABASE_NAME = "upals-meditation-tracker"
SESSIONS_COLLECTION = "sessions"
WEEKLY_GOAL_COLLECTION = "weekly_goal"
BUDGET_COLLECTION = "budget"
WEEKLY_GOAL_DOCUMENT_ID = "default"
BUDGET_DOCUMENT_ID = "default"
DEFAULT_WEEKLY_TARGET_SECONDS = 3600.0
DEFAULT_DAILY_BUDGET = 100.0

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
sessions_collection = db[SESSIONS_COLLECTION]
weekly_goal_collection = db[WEEKLY_GOAL_COLLECTION]
budget_collection = db[BUDGET_COLLECTION]


class SessionCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_seconds: float

    @validator("duration_seconds")
    def validate_duration(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Duration must be greater than zero.")
        return value

    @validator("end_time")
    def validate_end_time(cls, end_time: datetime, values) -> datetime:
        start_time = values.get("start_time")
        if start_time and end_time <= start_time:
            raise ValueError("End time must be after start time.")
        return end_time


class SessionResponse(BaseModel):
    id: str
    start_time: datetime
    end_time: datetime
    duration_seconds: float


class StatsResponse(BaseModel):
    weekly_seconds: float
    monthly_seconds: float
    yearly_seconds: float
    total_seconds: float
    total_sessions: int
    weekly_target_seconds: float
    weekly_progress_percentage: float


class WeeklyGoalResponse(BaseModel):
    target_seconds: float


class WeeklyGoalUpdate(BaseModel):
    target_seconds: float

    @validator("target_seconds")
    def validate_target(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Target must be greater than zero.")
        return value


class BudgetSpending(BaseModel):
    date: str  # Format: YYYY-MM-DD
    amount: float
    note: str = ""

    @validator("amount")
    def validate_amount(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Amount cannot be negative.")
        return value


class BudgetConfig(BaseModel):
    daily_budget: float

    @validator("daily_budget")
    def validate_daily_budget(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Daily budget must be greater than zero.")
        return value


BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Upal's Meditation Tracker")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Add middleware to prevent caching during development
class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheMiddleware)


def ensure_weekly_goal_default() -> None:
    weekly_goal_collection.update_one(
        {"_id": WEEKLY_GOAL_DOCUMENT_ID},
        {"$setOnInsert": {"target_seconds": DEFAULT_WEEKLY_TARGET_SECONDS}},
        upsert=True,
    )


def ensure_budget_default() -> None:
    # Delete and recreate to clear bad data
    budget_collection.delete_one({"_id": BUDGET_DOCUMENT_ID})
    budget_collection.insert_one({
        "_id": BUDGET_DOCUMENT_ID,
        "daily_budget": DEFAULT_DAILY_BUDGET,
        "spendings": [],
    })


def get_weekly_goal_document() -> dict:
    goal = weekly_goal_collection.find_one({"_id": WEEKLY_GOAL_DOCUMENT_ID})
    if goal is None:
        ensure_weekly_goal_default()
        goal = weekly_goal_collection.find_one({"_id": WEEKLY_GOAL_DOCUMENT_ID})
    return goal or {"target_seconds": DEFAULT_WEEKLY_TARGET_SECONDS}


def serialize_session(document: dict) -> SessionResponse:
    return SessionResponse(
        id=str(document["_id"]),
        start_time=document["start_time"],
        end_time=document["end_time"],
        duration_seconds=float(document["duration_seconds"]),
    )


def aggregate_duration(filter_query: dict | None = None) -> float:
    pipeline = []
    if filter_query:
        pipeline.append({"$match": filter_query})
    pipeline.append({"$group": {"_id": None, "total": {"$sum": "$duration_seconds"}}})
    result = list(sessions_collection.aggregate(pipeline))
    if not result:
        return 0.0
    return float(result[0].get("total", 0.0))


@app.on_event("startup")
def on_startup() -> None:
    ensure_weekly_goal_default()
    ensure_budget_default()


@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/sessions", response_model=List[SessionResponse])
def list_sessions() -> List[SessionResponse]:
    cursor = sessions_collection.find().sort("start_time", -1)
    return [serialize_session(document) for document in cursor]


@app.post("/api/sessions", response_model=SessionResponse, status_code=201)
def create_session(payload: SessionCreate) -> SessionResponse:
    document = payload.dict()
    result = sessions_collection.insert_one(document)
    document["_id"] = result.inserted_id
    return serialize_session(document)


@app.delete("/api/sessions/{session_id}", status_code=204)
def delete_session(session_id: str) -> None:
    try:
        object_id = ObjectId(session_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid session identifier")

    delete_result = sessions_collection.delete_one({"_id": object_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")


@app.get("/api/weekly-target", response_model=WeeklyGoalResponse)
def get_weekly_target() -> WeeklyGoalResponse:
    goal = get_weekly_goal_document()
    return WeeklyGoalResponse(target_seconds=float(goal.get("target_seconds", 0.0)))


@app.put("/api/weekly-target", response_model=WeeklyGoalResponse)
def update_weekly_target(payload: WeeklyGoalUpdate) -> WeeklyGoalResponse:
    weekly_goal_collection.update_one(
        {"_id": WEEKLY_GOAL_DOCUMENT_ID},
        {"$set": {"target_seconds": float(payload.target_seconds)}},
        upsert=True,
    )
    return WeeklyGoalResponse(target_seconds=float(payload.target_seconds))


@app.get("/api/stats", response_model=StatsResponse)
def get_stats() -> StatsResponse:
    now = datetime.now()
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    weekly_seconds = aggregate_duration({"start_time": {"$gte": start_of_week}})
    monthly_seconds = aggregate_duration({"start_time": {"$gte": start_of_month}})
    yearly_seconds = aggregate_duration({"start_time": {"$gte": start_of_year}})
    total_seconds = aggregate_duration()
    total_sessions = sessions_collection.count_documents({})

    goal_document = get_weekly_goal_document()
    weekly_target_seconds = float(goal_document.get("target_seconds", 0.0))
    if weekly_target_seconds > 0:
        weekly_progress_percentage = (weekly_seconds / weekly_target_seconds) * 100
    else:
        weekly_progress_percentage = 0.0

    return StatsResponse(
        weekly_seconds=weekly_seconds,
        monthly_seconds=monthly_seconds,
        yearly_seconds=yearly_seconds,
        total_seconds=total_seconds,
        total_sessions=total_sessions,
        weekly_target_seconds=weekly_target_seconds,
        weekly_progress_percentage=weekly_progress_percentage,
    )


@app.get("/api/budget/config")
def get_budget_config():
    budget = budget_collection.find_one({"_id": BUDGET_DOCUMENT_ID})
    if budget is None:
        ensure_budget_default()
        budget = budget_collection.find_one({"_id": BUDGET_DOCUMENT_ID})
    return {
        "daily_budget": float(budget.get("daily_budget", DEFAULT_DAILY_BUDGET)),
    }


@app.put("/api/budget/config")
def update_budget_config(payload: BudgetConfig):
    budget_collection.update_one(
        {"_id": BUDGET_DOCUMENT_ID},
        {"$set": {"daily_budget": float(payload.daily_budget)}},
        upsert=True,
    )
    return {"daily_budget": float(payload.daily_budget)}


@app.get("/api/budget/spendings")
def get_spendings():
    budget = budget_collection.find_one({"_id": BUDGET_DOCUMENT_ID})
    if not budget:
        return {"spendings": []}
    
    spendings = budget.get("spendings", [])
    # Clean spendings to only include serializable fields
    cleaned_spendings = []
    for spending in spendings:
        cleaned_spendings.append({
            "date": spending.get("date", ""),
            "amount": float(spending.get("amount", 0)),
            "note": spending.get("note", ""),
        })
    
    return {"spendings": cleaned_spendings}


@app.post("/api/budget/spendings")
def add_spending(payload: BudgetSpending):
    spending = {
        "date": payload.date,
        "amount": float(payload.amount),
        "note": payload.note,
    }

    budget_collection.update_one(
        {"_id": BUDGET_DOCUMENT_ID},
        {"$push": {"spendings": spending}},
        upsert=True,
    )

    return spending


@app.delete("/api/budget/spendings/{spending_date}/{spending_amount}")
def delete_spending(spending_date: str, spending_amount: float):
    try:
        spending_amount_float = float(spending_amount)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    result = budget_collection.update_one(
        {"_id": BUDGET_DOCUMENT_ID},
        {"$pull": {"spendings": {"date": spending_date, "amount": spending_amount_float}}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Spending not found")

    return {"message": "Spending deleted"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
