import os
import json
import sqlite3
from dotenv import load_dotenv
from llama_index.core import Settings
from llama_index.llms.groq import Groq

load_dotenv()

DB_PATH = ("data/data_base/data.db")


def get_table_name(db_path: str = DB_PATH) -> str:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        conn.close()


        for table in tables:
            if table.lower() in ['receipts', 'transactions', 'receipt']:
                return table

        return tables[0] if tables else "transactions"
    except Exception as e:
        print(f"[ERROR] Failed to get table name: {e}")
        return "transactions"


def init_models():
    Settings.llm = Groq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )


def check_database(db_path: str = DB_PATH) -> bool:
    try:
        if not os.path.exists(db_path):
            print(f"[ERROR] Database file not found: {db_path}")
            return False

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        conn.close()

        if not tables:
            print(f"[ERROR] No tables found in database: {db_path}")
            return False

        print(f"[INFO] Database check passed. Found tables: {[table[0] for table in tables]}")
        return True

    except sqlite3.Error as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error during database check: {e}")
        return False


def classify_intent_and_generate_sql(query: str, table_name: str) -> dict:
    init_models()
    llm = Settings.llm

    prompt = f"""
You are an SQL expert. You analyze user queries and generate SQL queries.

Table structure "{table_name}":
- id (INTEGER)
- quantity (REAL)
- name (TEXT)
- price (REAL) - prices are in EUROS
- fs_receipt_id (TEXT)
- fs_receipt_issue_date (TEXT)
- org_name (TEXT) - store name
- ai_category (TEXT) - product category
- ai_name_without_brand_and_quantity (TEXT)
- ai_name_in_english_without_brand_and_quantity (TEXT)
- ai_brand (TEXT)
- ai_quantity_value (REAL)
- ai_quantity_unit (TEXT)
- unit_latitude (REAL)
- unit_longitude (REAL)

CRITICAL RULES:
1. Respond ONLY with valid JSON - no explanations, no markdown, no preamble
2. Start your response directly with {{ and end with }}
3. Do NOT include ```json or ``` markers
4. Do NOT explain your reasoning

Your task:
1. Determine intent from the list:
   - greeting (greetings, general questions)
   - spending_total (total spending)
   - spending_category (spending by category)
   - spending_store (spending at store)
   - spending_time (spending for period)
   - most_frequent (most frequent purchases/categories)
   - product_search (search for specific product)
   - fallback (doesn't fit SQL)

2. If answerable via SQL - generate correct SQL query
3. Output ONLY valid JSON

Response format:
{{
  "intent": "...",
  "sql": "SELECT ... FROM {table_name} WHERE ...",
  "needs_formatting": true
}}

If SQL not needed (greeting or complex query):
{{
  "intent": "greeting" or "fallback",
  "sql": null,
  "needs_formatting": false
}}

SQL rules:
- IMPORTANT: Use table name "{table_name}" not "transactions"
- Use LIKE '%...%' for string searches (case insensitive)
- For dates use strftime and comparisons
- For amounts use SUM(price)
- Always add LIMIT unless specified otherwise
- For product search look in name, ai_name_without_brand_and_quantity
- Remember: all prices are in EUROS

Examples:

Query: "how much did I spend in total?"
{{"intent": "spending_total", "sql": "SELECT SUM(price) as total, COUNT(*) as count FROM {table_name}", "needs_formatting": true}}

Query: "what did I buy at Lidl?"
{{"intent": "spending_store", "sql": "SELECT name, price, fs_receipt_issue_date FROM {table_name} WHERE org_name LIKE '%Lidl%' ORDER BY fs_receipt_issue_date DESC LIMIT 10", "needs_formatting": true}}

Query: "most frequent category"
{{"intent": "most_frequent", "sql": "SELECT ai_category, COUNT(*) as count, SUM(price) as total FROM {table_name} GROUP BY ai_category ORDER BY count DESC LIMIT 5", "needs_formatting": true}}

User query: "{query}"

Respond with ONLY the JSON object, nothing else:
"""

    response = llm.complete(prompt).text.strip()

    response = response.replace("```json", "").replace("```", "").strip()

    if not response.startswith("{"):
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end > start:
            response = response[start:end]
        else:
            print(f"[ERROR] No JSON found in response")
            print(f"[ERROR] Full response: {response[:500]}")
            return {
                "intent": "fallback",
                "sql": None,
                "needs_formatting": False
            }

    try:
        data = json.loads(response)
    except Exception as e:
        print(f"[ERROR] Failed to parse SQL generation: {e}")
        print(f"[ERROR] Response was: {response[:500]}")
        data = {
            "intent": "fallback",
            "sql": None,
            "needs_formatting": False
        }

    return data



def execute_sql(sql_query: str, db_path: str = DB_PATH):

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(sql_query)
        rows = cursor.fetchall()

        result = []
        for row in rows:
            result.append(dict(row))

        conn.close()
        return result

    except sqlite3.Error as e:
        print(f"[ERROR] SQL execution failed: {e}")
        print(f"[ERROR] Query was: {sql_query}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return None


def format_sql_results(intent: str, sql_result: list, query: str) -> str:

    if not sql_result:
        return "No results found for your query."

    init_models()
    llm = Settings.llm

    result_json = json.dumps(sql_result, ensure_ascii=False, indent=2)

    prompt = f"""
You are a financial assistant. The user asked a question, we executed an SQL query.
Now you need to answer the user in a clear and friendly way.

Rules:
1. Answer concisely and to the point
2. Use emojis for clarity (💰, 🛒, 📊, 🏪)
3. Round amounts to 2 decimal places
4. Answer in English
5. If there's a lot of data - show top 5-10
6. Add a brief summary
7. CRITICAL: ALL monetary amounts MUST be displayed with the Euro symbol (€)
   - Examples: "25.50€", "1,234.56€", "total of 500€"
   - NEVER show amounts without the € symbol
   - Format: X.XX€ (always 2 decimal places)

User's question: "{query}"

SQL query result (all prices are in Euros):
{result_json}

Formulate an answer for the user (remember to add € to ALL amounts):
"""

    response = llm.complete(prompt).text.strip()
    return response


def answer(query: str):

    if not check_database():
        return {
            "mode": "error",
            "intent": "fallback",
            "sql": None,
            "result": "Sorry, database is not available. Please check the database connection.",
            "db_available": False
        }


    table_name = get_table_name()
    print(f"[INFO] Using table: {table_name}")

    intent_data = classify_intent_and_generate_sql(query, table_name)
    intent = intent_data.get("intent")
    sql_query = intent_data.get("sql")
    needs_formatting = intent_data.get("needs_formatting", False)

    if intent == "greeting":
        return {
            "mode": "direct",
            "intent": intent,
            "sql": None,
            "result": "Hello! 👋 I'm your financial assistant. I can tell you about your spending, purchases, and much more. Just ask!",
            "db_available": True
        }

    if intent == "fallback" or not sql_query:
        return {
            "mode": "fallback",
            "intent": intent,
            "sql": None,
            "result": "I'm sorry, I couldn't understand your query or it cannot be answered using the available data. Please try rephrasing or ask about your spending, purchases, or transactions.",
            "db_available": True
        }

    sql_result = execute_sql(sql_query)

    if sql_result is not None:
        if needs_formatting and sql_result:
            formatted_answer = format_sql_results(intent, sql_result, query)
        elif sql_result:
            formatted_answer = json.dumps(sql_result, ensure_ascii=False, indent=2)
        else:
            formatted_answer = "No results found for your query."

        return {
            "mode": "sql",
            "intent": intent,
            "sql": sql_query,
            "result": formatted_answer,
            "raw_result": sql_result,
            "db_available": True
        }
    else:
        return {
            "mode": "error",
            "intent": intent,
            "sql": sql_query,
            "result": "Sorry, there was an error executing the query. Please try again or rephrase your question.",
            "db_available": True
        }

if __name__ == "__main__":
    print("[INFO] Checking database...")
    db_ok = check_database()
    print(f"[INFO] Database status: {'OK' if db_ok else 'NOT AVAILABLE'}")

    test_queries = [
        "hello",
        "how much did I spend in total?",
        "what did I buy yesterday?",
        "grocery spending",
        "how much did I spend at Lidl?",
        "what's the most frequent category?",
        "tomatoes",
        "tell me about my transport spending",
        "what did I buy most often?",
        "show last 5 purchases"
    ]

    for query in test_queries:
        print("\n" + "=" * 70)
        print(f"QUERY: {query}")
        print("=" * 70)

        r = answer(query)

        print(f"\n[INTENT] {r['intent']}")
        print(f"[MODE] {r['mode']}")
        print(f"[DB AVAILABLE] {r.get('db_available', 'Unknown')}")
        if r.get('sql'):
            print(f"[SQL] {r['sql']}")

        print(f"\n[ANSWER]")
        print(r["result"])

        print("\n")