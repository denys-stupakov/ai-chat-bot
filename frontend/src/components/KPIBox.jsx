// components/KPIBox.jsx
export default function KPIBox({ title, value }) {
  return (
    <div className="bg-white shadow p-4 rounded-xl">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
