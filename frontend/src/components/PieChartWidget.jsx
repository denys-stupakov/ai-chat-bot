// PieChartWidget.jsx
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts"

export default function PieChartWidget({ title, data, nameKey, valueKey }) {
  return (
    <div className="bg-white p-4 shadow rounded-xl">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} label />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
