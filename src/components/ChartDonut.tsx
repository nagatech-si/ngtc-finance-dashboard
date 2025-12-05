

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useState } from 'react';

interface SubKategori {
  sub_kategori: string;
  total: number;
}

interface ChartData {
  name: string; // kategori
  value: number; // total kategori
  subs?: SubKategori[];
}

interface ChartDonutProps {
  data: ChartData[];
  totalKategori?: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ChartDonut({ data, totalKategori }: ChartDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  const handlePieLeave = () => {
    setActiveIndex(null);
  };

  const activeData = activeIndex !== null ? data[activeIndex] : null;

  function CustomTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
      const sub = payload[0].payload;
      return (
        <div style={{ background: 'white', border: '1px solid #eee', padding: 12, minWidth: 180, fontSize: 13 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{sub.name}</div>
          <div>Nominal: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sub.value)}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={1}
            dataKey="value"
            onMouseEnter={handlePieEnter}
            onMouseLeave={handlePieLeave}
            activeIndex={activeIndex ?? undefined}
            label={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend 
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconSize={12}
            fontSize={10}
            wrapperStyle={{fontSize: "13px", paddingLeft: "20px"}}
            formatter={(value, entry) => {
              const data = entry.payload;
              return <span>{value}: <strong style={{fontSize: 14}}>Rp {data.value.toLocaleString('id-ID')}</strong></span>;
            }}
           />
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
