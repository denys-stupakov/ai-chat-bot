from fastapi import APIRouter, Query
import sqlite3
import datetime
import pandas as pd
import re

router = APIRouter()

DB_PATH = r"data/data_base/data.db"

@router.get("/sort_by_year")
async def sort_by_year():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT fs_receipt_issue_date, price FROM Receipts")
    rows = cursor.fetchall()
    conn.close()

    yearly_spending = {}
    for date_str, price in rows:
        if not date_str or price is None:
            continue
        try:
            date = datetime.datetime.fromisoformat(date_str.split(" ")[0])
        except Exception:
            continue
        year = str(date.year)
        yearly_spending[year] = yearly_spending.get(year, 0.0) + float(price)

    yearly_spending = {year: int(round(total)) for year, total in yearly_spending.items()}
    return yearly_spending


df = pd.read_csv("data/Receipts.csv")

df["fs_receipt_issue_date"] = pd.to_datetime(df["fs_receipt_issue_date"], errors="coerce")
df["Purchase_Date"] = df["fs_receipt_issue_date"].dt.date
df["Month"] = df["fs_receipt_issue_date"].dt.to_period("M").astype(str)
df["Weekday"] = df["fs_receipt_issue_date"].dt.day_name()
df["Hour"] = df["fs_receipt_issue_date"].dt.hour
df["Spend"] = df["price"] * df["quantity"]


def normalize_store_name(store_name):
    if pd.isna(store_name):
        return "Unknown"

    name = str(store_name).strip()

    patterns_to_remove = [
        r",?\s*s\.r\.o\.?",
        r",?\s*v\.o\.s\.?",
        r",?\s*a\.s\.?",
        r",?\s*spol\.\s*s\s*r\.o\.?",
        r",?\s*Slovenská republika",
        r",?\s*Slovakia",
        r",?\s*SR",
        r",?\s*Inc\.?",
        r",?\s*Ltd\.?",
        r",?\s*GmbH",
    ]

    for pattern in patterns_to_remove:
        name = re.sub(pattern, "", name, flags=re.IGNORECASE)

    name = re.sub(r"\s+", " ", name).strip()
    name = name.rstrip(",").strip()

    return name


df["normalized_store"] = df["org_name"].apply(normalize_store_name)
unique_stores = df["normalized_store"].unique()

def similar(a, b):
    a = a.lower()
    b = b.lower()
    return a in b or b in a


store_map = {}
for s in unique_stores:
    found = False
    for k in list(store_map.keys()):
        if similar(s, k):
            store_map[s] = k
            found = True
            break
    if not found:
        store_map[s] = s

df["store_group"] = df["normalized_store"].apply(lambda x: store_map.get(x, x))
spend_per_month = df.groupby("Month")["Spend"].sum().reset_index()


def get_top_category(series):
    series_clean = series.dropna()
    if len(series_clean) == 0:
        return "Unknown"
    vc = series_clean.value_counts()
    if len(vc) > 0:
        return vc.index[0]
    return "Unknown"


store_stats = df.groupby("store_group").agg({
    "Spend": "sum",
    "ai_category": get_top_category
}).reset_index()

store_stats = store_stats.rename(columns={
    "store_group": "org_name",
    "ai_category": "top_category"
})

basket_totals = df.groupby("fs_receipt_id")["Spend"].sum()
avg_basket = basket_totals.mean()
median_basket = basket_totals.median()

category_share = (
    df.groupby("ai_category")["Spend"].sum()
    .sort_values(ascending=False)
    .reset_index()
)

spend_by_city = df.groupby("unit_municipality")["Spend"].sum().reset_index()


store_visits = df.groupby("store_group")["fs_receipt_id"].nunique()
store_month_spend = df.groupby(["store_group", "Month"])["Spend"].sum().reset_index()
avg_month_spend = store_month_spend.groupby("store_group")["Spend"].mean()

store_stats = store_stats.merge(
    store_visits.rename("visit_count"),
    left_on="org_name",
    right_index=True,
    how="left"
)

store_stats = store_stats.merge(
    avg_month_spend.rename("avg_spend_per_month"),
    left_on="org_name",
    right_index=True,
    how="left"
)

store_stats["avg_spend_per_visit"] = store_stats["Spend"] / store_stats["visit_count"]
store_stats["months_active"] = store_month_spend.groupby("store_group")["Month"].nunique().values

spend_per_store = store_stats

df["Qty_Anomaly"] = df["quantity"] > 5
median_price = df.groupby("name")["price"].median()
df = df.join(median_price, on="name", rsuffix="_median")
df["Price_Anomaly"] = df["price"] > 2 * df["price_median"]

if df["unit_municipality"].notna().any():
    home_city = df["unit_municipality"].mode().iloc[0]
else:
    home_city = None

df["Location_Anomaly"] = (
    df["unit_municipality"] != home_city if home_city else False
)

travel_events = df[df["Location_Anomaly"]]

duplicate_items = df[df.duplicated(
    subset=["name", "price", "fs_receipt_id"], keep=False
)]

weekend_days = ["Saturday", "Sunday"]
weekend_travel = travel_events[travel_events["Weekday"].isin(weekend_days)]
weekend_travel_counts = (
    weekend_travel.groupby("unit_municipality")["Spend"]
    .sum()
    .reset_index()
    .sort_values("Spend", ascending=False)
)


def detect_longest_consecutive_block(date_list):
    dates = sorted(set(pd.to_datetime(date_list)))
    if len(dates) == 0:
        return None

    best_start = dates[0]
    best_end = dates[0]
    best_len = 1

    cur_start = dates[0]
    cur_end = dates[0]
    cur_len = 1

    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            cur_end = dates[i]
            cur_len += 1
        else:
            if cur_len > best_len:
                best_len = cur_len
                best_start = cur_start
                best_end = cur_end
            cur_start = dates[i]
            cur_end = dates[i]
            cur_len = 1

    if cur_len > best_len:
        best_len = cur_len
        best_start = cur_start
        best_end = cur_end

    if best_len < 2:
        return None

    return {
        "consecutive_days": best_len,
        "start_date": best_start.date(),
        "end_date": best_end.date(),
        "weekday_range": f"{best_start.strftime('%a')}–{best_end.strftime('%a')}",
    }


vacation_cities = []
for city, group in travel_events.groupby("unit_municipality"):
    result = detect_longest_consecutive_block(group["Purchase_Date"].unique())
    if result:
        vacation_cities.append({
            "city": city,
            **result
        })

vacation_cities = [x for x in vacation_cities if x["city"] != home_city]
vacation_cities = sorted(vacation_cities, key=lambda x: x["consecutive_days"], reverse=True)

@router.get("/insights")
def get_insights():
    return {
        "home_city": home_city,
        "vacation_cities": vacation_cities,
        "spend_per_store": spend_per_store.to_dict(orient="records"),
        "category_share": category_share.to_dict(orient="records"),
        "avg_basket": avg_basket,
        "median_basket": median_basket,
    }


@router.get("/sort_by_week")
async def sort_by_week():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT fs_receipt_issue_date, price FROM Receipts")
    rows = cursor.fetchall()
    conn.close()

    weekly_spending = {
        "Monday": 0.0,
        "Tuesday": 0.0,
        "Wednesday": 0.0,
        "Thursday": 0.0,
        "Friday": 0.0,
        "Saturday": 0.0,
        "Sunday": 0.0
    }

    for date_str, price in rows:
        if not date_str or price is None:
            continue
        try:
            date = datetime.datetime.fromisoformat(date_str.split(" ")[0])
        except Exception:
            continue
        weekday = date.strftime("%A")
        weekly_spending[weekday] += float(price)

    weekly_spending = {day: int(round(total)) for day, total in weekly_spending.items()}
    return weekly_spending

@router.get("/sort_by_month")
async def sort_by_month():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT fs_receipt_issue_date, price FROM Receipts")
    rows = cursor.fetchall()
    conn.close()

    monthly_spending = {
        "January": 0.0,
        "February": 0.0,
        "March": 0.0,
        "April": 0.0,
        "May": 0.0,
        "June": 0.0,
        "July": 0.0,
        "August": 0.0,
        "September": 0.0,
        "October": 0.0,
        "November": 0.0,
        "December": 0.0
    }

    for date_str, price in rows:
        if not date_str or price is None:
            continue
        try:
            date = datetime.datetime.fromisoformat(date_str.split(" ")[0])
        except Exception:
            continue
        month_name = date.strftime("%B")
        monthly_spending[month_name] += float(price)

    monthly_spending = {month: int(round(total)) for month, total in monthly_spending.items()}
    return monthly_spending


@router.get("/total_by_date")
async def total_from_day(date: str = Query(..., description="Date in format YYYY-MM-DD")):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT price 
        FROM Receipts 
        WHERE DATE(fs_receipt_issue_date) = ?
    """, (date,))
    rows = cursor.fetchall()
    conn.close()

    total = sum(float(price[0]) for price in rows if price[0] is not None)
    return {"date": date, "total": int(round(total))}


# def all_money():
#     conn = sqlite3.connect(DB_PATH)
#     cursor = conn.cursor()
#
#     cursor.execute("SELECT price FROM Receipts")
#     rows = cursor.fetchall()
#     conn.close()
#
#     all = 0.0
#
#     for row in rows:
#         all += row[0]
#
#     return all