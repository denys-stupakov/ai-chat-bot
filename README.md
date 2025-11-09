# 🛍️ Intelligent AI Shopping Chatbot

## 📖 Description
An **intelligent AI assistant** that automatically analyzes your **shopping receipts** and shows you **how much, when, where, and on what** you spend your money.  
The system aggregates your data by **day / month / year** and lets you track your spending in real time.

Useful for people who:
- monitor their budget  
- want to avoid unnecessary expenses  
- want to better understand their spending habits  

This tool provides a fast, clear overview of your purchases and helps you optimize your expenses.

---

## ⚙️ Features
- 🧠 AI shopping assistant (chatbot)  
- 📊 Data analysis and personalized insights  
- 🏪 Detection of most frequently visited stores  
- 🧾 Category-based spending analysis  
- 🥇 Top purchased products  
- 📈 Spending trend visualization over time  

---

## 🧩 Tech Stack
- **FastAPI**  
- **React**  
- **SQLite**  
- **Pandas**  
- **Groq**  
- **LlamaIndex**

---

### 🖥️ Backend
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```


###  Frontend
```bash
cd frontend
cd chat-bot
npm install
npm run dev
```

