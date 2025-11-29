import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from 'recharts';
import { useState } from 'react';


interface ISubItem {
  name: string;
  total: number;
}

interface IStackedBarKategoriProps {
  data: Array<{ kategori: string; subs: ISubItem[] }>;
  title?: string;
  description?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#7B61FF', '#F95D6A', '#4CAF50', '#9C27B0', '#03A9F4', '#FF9800'
];

const keyFromName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');

export default function StackedBarKategori({ data, title, description }: IStackedBarKategoriProps) {
  const [hoveredBar, setHoveredBar] = useState<{ kategori: string; subName: string; value: number; index: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const allSubNames: string[] = [];
  data.forEach(d => d.subs.forEach(s => { if (!allSubNames.includes(s.name)) allSubNames.push(s.name); }));

  const chartData = data.map(d => {
    const row: any = { kategori: d.kategori };
    let totalKategori = 0;
    d.subs.forEach(s => { row[keyFromName(s.name)] = s.total; totalKategori += s.total; });
    allSubNames.forEach(n => { const k = keyFromName(n); if (row[k] === undefined) row[k] = 0; });
    row._total = totalKategori;
    return row;
  }).sort((a, b) => b._total - a._total); // Sort by total descending
  

  // Bar size dinamis: jika kategori < 4, bar lebih lebar
  const barSize = chartData.length < 4 ? 80 : 32;
   // Calculate dynamic YAxis width based on max value
  const maxValue = Math.max(...chartData.map(d => d._total));
  const formattedMaxValue = maxValue.toLocaleString('id-ID');
  const yAxisWidth = Math.max(10, formattedMaxValue.length * 4.5); // Minimum 60px, 8px per char + padding
  return (
    <div
      className="rounded-xl"
      style={{ background: '#fff', position: 'relative' }}
      onMouseMove={e => {
        setMousePos({ x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => setMousePos(null)}
    >
      {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
      {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
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
          margin={{ top: 40, right: 60, left: 60, bottom: 20 }}
          barCategoryGap={30}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#e7e7e7ff" />
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
                </g>
              );
            }}
          />
          <YAxis
            tickFormatter={(v) => v.toLocaleString('id-ID')}
            width={yAxisWidth}
            tick={{ fontSize: 14, fill: '#222', fontWeight: 600 }}
            axisLine={{ stroke: '#e7e7e7ff' }}
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
              offset={15}
              formatter={(v: number) => v ? `Rp ${v.toLocaleString('id-ID')}` : ''}
              style={{
                fontSize: 16,
                fill: '#606060ff',
                textShadow: '0 1px 2px #fff',
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hoveredBar && mousePos && (
        <div style={{
          position: 'fixed',
          left: mousePos.x - 200,
          top: mousePos.y - 150,
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
