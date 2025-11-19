import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from 'recharts';
import { useState } from 'react';
// Custom Tooltip hanya tampilkan bar yang di-hover
const CustomTooltip = ({ active, payload, label }: any) => {
  // Tooltip hanya muncul jika mouse benar-benar di atas bar (payload ada dan value > 0)
  if (active && payload && payload.length > 0) {
    const bar = payload.find((p: any) => p.value > 0 && p.dataKey !== '_total');
    // Jika mouse di area kosong chart, payload semua value = 0, maka tooltip tidak muncul
    if (!bar || bar.value === 0) return null;
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #ececec',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        minWidth: 120,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{bar.name}</div>
        <div>Nilai: <b>Rp {bar.value.toLocaleString('id-ID')}</b></div>
        <div>Kategori: {label}</div>
      </div>
    );
  }
  return null;
};

interface ISubItem {
  name: string;
  total: number;
}

interface IStackedBarKategoriProps {
  data: Array<{ kategori: string; subs: ISubItem[] }>;
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#7B61FF', '#F95D6A', '#4CAF50', '#9C27B0', '#03A9F4', '#FF9800'
];

const keyFromName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');

export default function StackedBarKategori({ data, title }: IStackedBarKategoriProps) {
  const [hoveredBar, setHoveredBar] = useState<{ kategori: string; subName: string; value: number; index: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const allSubNames: string[] = [];
  data.forEach(d => d.subs.forEach(s => { if (!allSubNames.includes(s.name)) allSubNames.push(s.name); }));

  const chartData = data.map(d => {
    const row: any = { kategori: d.kategori };
    let totalKategori = 0;
    d.subs.forEach(s => { row[keyFromName(s.name)] = s.total; totalKategori += s.total; });
    allSubNames.forEach(n => { const k = keyFromName(n); if (row[k] === undefined) row[k] = 0; });
    row._total = totalKategori; // simpan total untuk label dan persen
    return row;
  });

  // Bar size dinamis: jika kategori < 4, bar lebih lebar
  const barSize = chartData.length < 4 ? 60 : 32;
  return (
    <div
      className="rounded-xl shadow p-8 mb-8"
      style={{ background: '#fff', position: 'relative' }}
      onMouseMove={e => {
        setMousePos({ x: e.clientX + 16, y: e.clientY - 24 });
      }}
      onMouseLeave={() => setMousePos(null)}
    >
      {title && <h2 className="text-xl font-bold mb-4 text-foreground">{title}</h2>}
      <div className="flex items-center justify-start mb-2">
        <Legend
          layout="horizontal"
          verticalAlign="top"
          align="left"
          wrapperStyle={{ fontSize: 14, marginBottom: 0, marginLeft: 8 }}
          iconSize={16}
        />
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 60, left: 60, bottom: 20 }}
          barCategoryGap={30}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
          <XAxis
            dataKey="kategori"
            interval={0}
            axisLine={false}
            tickLine={false}
            tick={({ x, y, payload, index }) => {
              // Center label by shifting x by half barSize
              const barCenter = x + barSize / 2;
              return (
                <g>
                  <text
                    x={barCenter}
                    y={y + 16}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={700}
                    fill="#222"
                  >
                    {payload.value}
                  </text>
                  {/* Centered X axis line under label */}
                  <line
                    x1={barCenter - barSize / 2}
                    x2={barCenter + barSize / 2}
                    y1={y + 20}
                    y2={y + 20}
                    stroke="#ececec"
                    strokeWidth={2}
                  />
                </g>
              );
            }}
          />
          <YAxis
            tickFormatter={(v) => v.toLocaleString('id-ID')}
            width={90}
            tick={{ fontSize: 15, fill: '#222', fontWeight: 600 }}
            axisLine={{ stroke: '#ececec' }}
            domain={[0, 'auto']}
          />
          {/* Tooltip default di-disable, tooltip manual di bawah */}
          {allSubNames.map((subName, idx) => (
            <Bar
              key={subName}
              dataKey={keyFromName(subName)}
              stackId="total"
              name={subName}
              fill={COLORS[idx % COLORS.length]}
              barSize={barSize}
              radius={idx === allSubNames.length - 1 ? [16,16,0,0] : [0,0,0,0]}
              isAnimationActive={true}
              onMouseOver={(_, i) => {
                // cari kategori dan value
                const kategori = chartData[i].kategori;
                const value = chartData[i][keyFromName(subName)];
                setHoveredBar({ kategori, subName, value, index: i });
              }}
              onMouseOut={() => {
                setHoveredBar(null);
              }}
            />
          ))}
          {/* Label total tahunan kategori di atas bar stack */}
          <Bar dataKey="_total" fill="transparent">
            <LabelList
              dataKey="_total"
              position="top"
              formatter={(v: number) => v ? `Rp ${v.toLocaleString('id-ID')}` : ''}
              style={{
                fontSize: 16,
                fontWeight: 900,
                fill: '#222',
                textShadow: '0 1px 2px #fff',
                letterSpacing: 0.5,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Tooltip manual, muncul di posisi mouse */}
      {hoveredBar && mousePos && (
        <div style={{
          position: 'fixed',
          left: mousePos.x + 16,
          top: mousePos.y - 24,
          background: '#fff',
          border: '1px solid #ececec',
          borderRadius: 10,
          padding: 12,
          fontSize: 15,
          minWidth: 120,
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{hoveredBar.subName}</div>
          <div>Nilai: <b>Rp {hoveredBar.value.toLocaleString('id-ID')}</b></div>
          <div>Kategori: {hoveredBar.kategori}</div>
        </div>
      )}
    </div>
  );
}
