import pandas as pd
import sqlite3
import os

def create_database():
    DB_PATH = r"data/data_base/data.db"

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("The old database has been deleted.")

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)

    csv_tables = {
        "Receipts": "data/Receipts.csv",
    }

    for table_name, csv_file in csv_tables.items():
        try:
            df = pd.read_csv(csv_file, encoding="utf-8", sep=",")
            df.to_sql(table_name, conn, index=False, if_exists="replace", chunksize=15000)
            print(f"Imported {table_name}")
        except Exception as e:
            print(f"Import error {table_name}: {e}")

    for table in csv_tables.keys():
        count = pd.read_sql(f"SELECT COUNT(*) as total FROM {table};", conn)

    tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)
    print(tables)

    conn.close()
    print("\nDatabase created successfully:", DB_PATH)
