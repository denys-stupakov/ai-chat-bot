import { Link } from "react-router-dom"
import SavingsBar from "../components/SavingsBar.jsx"
import SpendingsChat from "../components/SpendingsChat.jsx"
import { useEffect, useState } from "react"

export default function Home() {
  const [todayTotal, setTodayTotal] = useState(0)
  const [selectedDate, setSelectedDate] = useState("2023-06-08")

  const maxDate = new Date("2023-06-08")

  useEffect(() => {
    async function loadData() {
      const totalToday = await fetch(
        `http://localhost:8000/api/date/total_by_date?date=${selectedDate}`
      )
        .then((r) => r.json())
        .then((d) => d.total)
        .catch(() => 0)

      setTodayTotal(totalToday)
    }

    loadData()
  }, [selectedDate])

  async function updateDate(newDate) {
    const formatted = newDate.toISOString().split("T")[0]
    setSelectedDate(formatted)
    try {
      const res = await fetch(
        `http://localhost:8000/api/date/total_by_date?date=${formatted}`
      )
      const data = await res.json()
      if (data?.total !== undefined) setTodayTotal(data.total)
    } catch (err) {
      console.error("Fetch by date failed:", err)
    }
  }

  return (
    <div className="flex-col justify-center min-h-screen bg-white text-gray-800">

      <main className="flex-1 flex flex-col px-12 py-10">
        <h1 className="text-7xl font-medium mb-10 leading-tight text-center">
          Shop with your new AI tools
        </h1>

        <div className="flex justify-between gap-6">
          <Link
            to="/chat"
            className="bg-gray12 p-4 rounded-lg shadow-sm flex flex-col justify-between
                       transition-all duration-300 border border-transparent
                       hover:-translate-y-1 hover:shadow-lg hover:border-blue-400 hover:bg-blue-50/30"
          >
            <h3 className="text-md font-semibold mb-2">Having some questions about your shopings?</h3>
          </Link>

          <div
              className="bg-gray12 p-4 rounded-lg shadow-sm flex flex-col justify-between
                         transition-all w-100 duration-300 border border-transparent
                         hover:-translate-y-1 hover:shadow-lg hover:border-blue-400 hover:bg-blue-50/30"
            >
              <SpendingsChat total={todayTotal} />
          </div>

          <div
            className="bg-gray12 p-0 rounded-lg shadow-sm flex flex-col justify-between overflow-hidden
                       transition-all duration-300 border border-transparent
                       hover:-translate-y-1 hover:shadow-lg hover:border-blue-400 hover:bg-blue-50/30"
          >
            <div className="p-4">
              <h3 className="text-md font-semibold mb-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const current = new Date(selectedDate)
                    current.setDate(current.getDate() - 1)
                    updateDate(current)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ←
                </button>

                <span className="text-gray-800 text-lg font-semibold">
                  Your boughts ({selectedDate})
                </span>

                <button
                  onClick={() => {
                    const current = new Date(selectedDate)
                    const next = new Date(current)
                    next.setDate(current.getDate() + 1)
                    if (next > maxDate) return
                    updateDate(next)
                  }}
                  className={`text-2xl font-bold ${
                    selectedDate === "2023-06-08"
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  disabled={selectedDate === "2023-06-08"}
                >
                  →
                </button>
              </h3>

              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">
                  {todayTotal !== null && todayTotal !== undefined
                    ? `${todayTotal}€`
                    : "0€"}
                </span>
              </div>
            </div>

            <img
              src="/wave.svg"
              alt="Chart"
              className="w-full h-auto object-cover mt-auto rounded-b-lg"
            />
          </div>
        </div>
      </main>

      <div className="w-full flex justify-center mt-10">
        <Link
          to="/dashboard"
          className="bg-original text-white px-6 py-4 rounded-lg w-80"
        >
          <h3 className="text-md font-semibold text-center">
            Get some insights about client
          </h3>
        </Link>
      </div>

    </div>
  )
}

