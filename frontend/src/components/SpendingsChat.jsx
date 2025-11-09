import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

export default function SpendingsChat() {
  const [mode, setMode] = useState("month"); // "month" або "year"
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const endpoint =
          mode === "month"
            ? "http://localhost:8000/api/date/sort_by_month"
            : "http://localhost:8000/api/date/sort_by_year";

        const res = await fetch(endpoint);
        const json = await res.json();

        const formatted = Object.entries(json).map(([label, value]) => ({
          label,
          spend: value,
        }));

        setData(formatted);
      } catch (err) {
        console.error("Fetch spendings error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mode]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Spendings by {mode === "month" ? "month" : "year"}
        </h2>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none"
        >
          <option value="month">By month</option>
          <option value="year">By year</option>
        </select>
      </div>

      <div className="flex-1 w-full h-48">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--color-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "var(--color-axis)",
                  fontSize: 11,
                  angle: mode === "month" ? 0 : -20,
                }}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v) => `${v}€`}
                labelFormatter={(l) => `${mode === "month" ? "Month" : "Year"} ${l}`}
                contentStyle={{
                  backgroundColor: "var(--color-tooltip-bg)",
                  border: `1px solid var(--color-tooltip-border)`,
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="var(--color-line)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p
        className="font-semibold mt-2 text-center"
        style={{ color: "var(--color-text-primary)" }}
      >
        Total: {data.reduce((sum, d) => sum + (d.spend || 0), 0)}€
      </p>
    </div>
  );
}
