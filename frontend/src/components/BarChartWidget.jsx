// BarChartWidget.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function BarChartWidget({ title, data, xKey, yKey }) {
  return (
    <div className="bg-white p-4 shadow rounded-xl">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey={xKey}/>
          <YAxis/>
          <Tooltip/>
          <Bar dataKey={yKey}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
