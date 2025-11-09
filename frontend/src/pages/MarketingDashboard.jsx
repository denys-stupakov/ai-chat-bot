import { useEffect, useState } from "react"
import KPIBox from "../components/KPIBox"
import BarChartWidget from "../components/BarChartWidget"
import PieChartWidget from "../components/PieChartWidget"
import {Link} from "react-router-dom";

export default function MarketingDashboard() {
    const [data, setData] = useState(null)

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/date/insights")
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
    }, [])

    if (!data) return <p>Loading...</p>

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl text-original font-bold">Client Insights Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPIBox title="Home City" value={data.home_city} />
                <KPIBox title="Avg. Receipt Amount (€)" value={data.avg_basket?.toFixed(2)} />
                <KPIBox title="Median Receipt (€)" value={data.median_basket?.toFixed(2)} />
                <Link
                  to="/map"
                  className="bg-original text-white px-6 py-4 rounded-lg w-80"
                >
                  <h3 className="text-md font-semibold text-center align-middle">
                    Visualise Data
                  </h3>
                </Link>
            </div>

            <div className="bg-original/10 shadow rounded-lg p-6 border border-original/20">
                <h2 className="text-xl font-semibold mb-6 text-original flex items-center gap-2">
                    <img src="/goal_icon.svg" className="w-6 h-6" />
                    Marketing Focus: Whole Period
                </h2>

                <div className="flex flex-col gap-6">
                    <div>
                        {data.spend_per_store && data.spend_per_store.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-original/20">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <img src="/shop_icon.svg" className="w-5 h-5" />
                                    Top Stores
                                </h3>

                                {/* HEADER */}
                                <div className="flex items-center justify-between p-2 bg-original/20 rounded text-xs font-semibold text-gray-700">
                                    <div className="flex items-center gap-2 w-3/12">
                                        <span>#</span>
                                        <span>Store</span>
                                    </div>

                                    <div className="flex w-9/12 justify-between">
                                        <span>Visits</span>
                                        <span>Avg/Month (€)</span>
                                        <span>Top Category</span>
                                        <span>Avg/Visit (€)</span>
                                        <span>Months Active</span>
                                        <span>Total (€)</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-1">
                                    {data.spend_per_store
                                        .sort((a, b) => b.Spend - a.Spend)
                                        .slice(0, 5)
                                        .map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                            >
                                                <div className="flex items-center gap-2 w-3/12">
                                                    <span className="text-lg font-bold text-original">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="font-medium text-sm">{item.org_name}</span>
                                                </div>

                                                <div className="flex w-9/12 justify-between">
                                                    <span>{item.visit_count}</span>
                                                    <span>{item.avg_spend_per_month?.toFixed(2)}</span>
                                                    <span>{item.top_category}</span>
                                                    <span>{item.avg_spend_per_visit?.toFixed(2)}</span>
                                                    <span>{item.months_active}</span>
                                                    <span>{item.Spend?.toFixed(2)} €</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {data.category_share && data.category_share.length > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-original/20 mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <img src="/categories_icon.svg" className="w-5 h-5" />
                            Top Categories
                        </h3>
                        <div className="space-y-2">
                            {data.category_share
                                .slice(0, 5)
                                .map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-original">#{idx + 1}</span>
                                            <span className="font-medium text-sm">{item.ai_category}</span>
                                        </div>
                                        <span>{item.Spend?.toFixed(2)} €</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white shadow rounded-lg p-6 border border-original/20">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-original">
                    <img src="/vacation_icon.svg" className="w-6 h-6" />
                    Vacation Cities (Longest Trips)
                </h2>

                {data.vacation_cities?.length > 0 ? (
                    <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="p-2 border-b">City</th>
                                <th className="p-2 border-b">Days</th>
                                <th className="p-2 border-b">Start</th>
                                <th className="p-2 border-b">End</th>
                                <th className="p-2 border-b">Weekday Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.vacation_cities.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-2 border-b">{item.city}</td>
                                    <td className="p-2 border-b">{item.consecutive_days}</td>
                                    <td className="p-2 border-b">{item.start_date}</td>
                                    <td className="p-2 border-b">{item.end_date}</td>
                                    <td className="p-2 border-b">{item.weekday_range}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No vacation cities detected.</p>
                )}
            </div>
        </div>
    )
}
