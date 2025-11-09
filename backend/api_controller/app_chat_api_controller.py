from fastapi import APIRouter
from pydantic import BaseModel
from hackaton2025.backend.creating_promt import answer

router = APIRouter()

class ChatMessage(BaseModel):
    text: str


@router.post("/process_text")
async def process_text(message: ChatMessage):
    print(f"Processing user query: {message.text}")
    result = answer(message.text)

    return {"response": result["result"]}
