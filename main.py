from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api_controller.app_chat_api_controller import router as chat_router
from backend.api_controller.date_sort_api_controller import router as date_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(date_router, prefix="/api/date", tags=["Date"])


if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)