import { useEffect, useState } from "react"
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Circle,
  Marker,
} from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-markercluster"
import Papa from "papaparse"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import L from "leaflet"

const makeIcon = (color, letter) => new L.DivIcon({
  html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${letter}</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})
const homeIcon = makeIcon("#f59e0b", "H")
const workIcon = makeIcon("#3b82f6", "W")
const vacationIcon = makeIcon("#10b981", "V")

export default function StoreMap() {
  const [clusters, setClusters] = useState([])
  const [detected, setDetected] = useState({})
  const [rawData, setRawData] = useState({})

  useEffect(() => {
    Papa.parse("/data/Receipts.csv", {
      download: true,
      header: true,
      complete: (res) => {
        const agg = {}
        const raw = {}
        res.data.forEach((r) => {
          const lat = parseFloat(r.unit_latitude)
          const lon = parseFloat(r.unit_longitude)
          if (isNaN(lat) || isNaN(lon)) return
          const spend = Number(r.price) * Number(r.quantity) || 0
          const date = r.fs_receipt_issue_date || ""
          const key = `${lat.toFixed(6)},${lon.toFixed(6)}`
          if (!agg[key]) {
            agg[key] = {
              lat,
              lon,
              org_name: r.org_name ?? "Unknown",
              spend: 0,
              count: 0,
              dates: new Set(),
            }
            raw[key] = []
          }
          agg[key].spend += spend
          agg[key].count += 1
          if (date) agg[key].dates.add(date)
          raw[key].push({ ...r })
        })
        const list = Object.values(agg).map((p) => ({
          ...p,
          dates: Array.from(p.dates).sort(),
        }))
        setClusters(list)
        setRawData(raw)
      },
    })
  }, [])

  useEffect(() => {
    if (!clusters.length) return
    const dist = (a, b) => {
      const R = 6371
      const toRad = (v) => (v * Math.PI) / 180
      const dLat = toRad(b.lat - a.lat)
      const dLon = toRad(b.lon - a.lon)
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    }

    const scored = clusters.map((c) => ({
      ...c,
      score: c.count * 0.7 + c.spend * 0.0003,
    }))
    const sorted = [...scored].sort((a, b) => b.score - a.score)
    const home = sorted[0]

    const workCandidates = clusters
      .filter((c) => c !== home && dist(home, c) > 0.5 && dist(home, c) < 30)
      .map((c) => {
        const workHours = c.dates.reduce((count, d) => {
          const dt = new Date(d)
          const hour = dt.getHours()
          const isWeekday = dt.getDay() >= 1 && dt.getDay() <= 5
          return count + (isWeekday && hour >= 8 && hour <= 18 ? 1 : 0)
        }, 0)
        const weeks = new Set()
        c.dates.forEach((d) => {
          const dt = new Date(d)
          weeks.add(`${dt.getFullYear()}-W${Math.floor((dt.getDate() + 6) / 7)}`)
        })
        return {
          ...c,
          workScore: c.count * 0.4 + workHours * 0.3 + weeks.size * 0.3,
        }
      })
      .sort((a, b) => b.workScore - a.workScore)
    const work = workCandidates[0] || null

    const vacationCandidates = clusters
      .filter((c) => {
        if (c === home || c === work) return false
        if (c.dates.length < 1) return false
        const first = new Date(c.dates[0])
        const last = new Date(c.dates[c.dates.length - 1])
        const days = (last - first) / 86400000
        if (days < 1) return false
        const isFar = dist(home, c) > 20
        const weekendDays = c.dates.filter(d => {
          const day = new Date(d).getDay()
          return day === 0 || day === 6
        }).length
        const weekendRatio = weekendDays / c.dates.length
        const avgSpend = c.spend / c.count
        const isExpensive = avgSpend > 25
        return isFar && (weekendRatio >= 0.4 || isExpensive)
      })
      .map((c) => {
        const first = new Date(c.dates[0])
        const last = new Date(c.dates[c.dates.length - 1])
        const days = (last - first) / 86400000
        const weekendRatio = c.dates.filter(d => {
          const day = new Date(d).getDay()
          return day === 0 || day === 6
        }).length / c.dates.length
        const avgSpend = c.spend / c.count
        return {
          ...c,
          vacationScore:
            c.spend * 0.45 +
            (weekendRatio > 0.5 ? 0.3 : 0.15) +
            Math.min(avgSpend / 80, 1) * 0.2 +
            (1 / (days + 1)) * 0.05,
        }
      })
      .sort((a, b) => b.vacationScore - a.vacationScore)
    const vacation = vacationCandidates[0] || null

    setDetected({ home, work, vacation })
  }, [clusters])

  const getKey = (p) => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`

  if (!clusters.length) return <p className="p-4">Loading map...</p>
  const maxSpend = Math.max(...clusters.map((c) => c.spend), 1)

  return (
    <div className="p-4 bg-white text-gray-800">
      <h1 className="text-2xl font-bold text-original mb-4">Data Visualization</h1>
      <MapContainer
        center={[48.70, 19.70]}
        zoom={7}
        style={{ height: "80vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MarkerClusterGroup maxClusterRadius={60} spiderfyOnMaxZoom={true} showCoverageOnHover={false}>
          {clusters.map((c, i) => {
            const radius = 8 + (c.spend / maxSpend) * 32
            return (
              <CircleMarker
                key={i}
                center={[c.lat, c.lon]}
                radius={radius}
                fillColor="#3b82f6"
                color="#1e40af"
                weight={2}
                opacity={1}
                fillOpacity={0.8}
              >
                <Popup>
                  <div className="text-sm max-w-xs">
                    <b>{c.org_name}</b>
                    <br />
                    Transactions: <b>{c.count}</b>
                    <br />
                    Total Spend: <b>EUR{c.spend.toFixed(2)}</b>
                    <hr className="my-1" />
                    <div className="text-xs space-y-1 mt-2">
                      {rawData[getKey(c)]?.map((r, idx) => (
                        <div key={idx} className="border-b border-gray-200 pb-1">
                          <div><b>Date:</b> {r.fs_receipt_issue_date}</div>
                          <div><b>Store:</b> {r.org_name}</div>
                          <div><b>Item:</b> {r.item_name}</div>
                          <div><b>Qty:</b> {r.quantity} x EUR{r.price} = EUR{(Number(r.price) * Number(r.quantity)).toFixed(2)}</div>
                          <div><b>Category:</b> {r.category_name}</div>
                          <div><b>Address:</b> {r.unit_address}</div>
                          <div><b>City:</b> {r.unit_city}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
                {c.count > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "12px",
                      pointerEvents: "none",
                      textShadow: "0 0 3px #000",
                    }}
                  >
                    {c.count}
                  </div>
                )}
              </CircleMarker>
            )
          })}
        </MarkerClusterGroup>

        {detected.home && (
          <Circle
            center={[detected.home.lat, detected.home.lon]}
            radius={18000}
            color="#f59e0b"
            fillColor="#f59e0b"
            fillOpacity={0.1}
            weight={4}
          >
            <Marker position={[detected.home.lat, detected.home.lon]} icon={homeIcon}>
              <Popup>
                <div className="text-sm">
                  <b>Home</b>
                  <br />
                  Store: {detected.home.org_name}
                  <br />
                  Transactions: {detected.home.count}
                  <br />
                  Total Spend: EUR{detected.home.spend.toFixed(2)}
                  <hr className="my-1" />
                  <div className="text-xs space-y-1 mt-2">
                    {rawData[getKey(detected.home)]?.map((r, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-1">
                        <div><b>Date:</b> {r.fs_receipt_issue_date}</div>
                        <div><b>Item:</b> {r.item_name}</div>
                        <div><b>Qty x Price:</b> {r.quantity} x EUR{r.price}</div>
                        <div><b>Category:</b> {r.category_name}</div>
                        <div><b>Address:</b> {r.unit_address}, {r.unit_city}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          </Circle>
        )}

        {detected.work && (
          <Circle
            center={[detected.work.lat, detected.work.lon]}
            radius={12000}
            color="#3b82f6"
            fillColor="#3b82f6"
            fillOpacity={0.1}
            weight={4}
          >
            <Marker position={[detected.work.lat, detected.work.lon]} icon={workIcon}>
              <Popup>
                <div className="text-sm">
                  <b>Work</b>
                  <br />
                  Store: {detected.work.org_name}
                  <br />
                  Transactions: {detected.work.count}
                  <br />
                  Total Spend: EUR{detected.work.spend.toFixed(2)}
                  <hr className="my-1" />
                  <div className="text-xs space-y-1 mt-2">
                    {rawData[getKey(detected.work)]?.map((r, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-1">
                        <div><b>Date:</b> {r.fs_receipt_issue_date}</div>
                        <div><b>Item:</b> {r.item_name}</div>
                        <div><b>Qty x Price:</b> {r.quantity} x EUR{r.price}</div>
                        <div><b>Category:</b> {r.category_name}</div>
                        <div><b>Address:</b> {r.unit_address}, {r.unit_city}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          </Circle>
        )}

        {detected.vacation && (
          <Circle
            center={[detected.vacation.lat, detected.vacation.lon]}
            radius={15000}
            color="#10b981"
            fillColor="#10b981"
            fillOpacity={0.1}
            weight={4}
          >
            <Marker position={[detected.vacation.lat, detected.vacation.lon]} icon={vacationIcon}>
              <Popup>
                <div className="text-sm">
                  <b>Vacation</b>
                  <br />
                  Store: {detected.vacation.org_name}
                  <br />
                  Transactions: {detected.vacation.count}
                  <br />
                  Total Spend: EUR{detected.vacation.spend.toFixed(2)}
                  <hr className="my-1" />
                  <div className="text-xs space-y-1 mt-2">
                    {rawData[getKey(detected.vacation)]?.map((r, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-1">
                        <div><b>Date:</b> {r.fs_receipt_issue_date}</div>
                        <div><b>Item:</b> {r.item_name}</div>
                        <div><b>Qty x Price:</b> {r.quantity} x EUR{r.price}</div>
                        <div><b>Category:</b> {r.category_name}</div>
                        <div><b>Address:</b> {r.unit_address}, {r.unit_city}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          </Circle>
        )}
      </MapContainer>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
          <span>Home</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4  h-4 rounded-full bg-blue-600"></div>
          <span>Work</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Vacation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-blue-600"></div>
          <span>Other (size = spend)</span>
        </div>
      </div>
    </div>
  )
}