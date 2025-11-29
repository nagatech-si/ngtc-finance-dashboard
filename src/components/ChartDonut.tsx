

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
      let percent = '0.00';
      if (typeof totalKategori === 'number' && totalKategori > 0 && typeof sub.value === 'number') {
        percent = ((sub.value / totalKategori) * 100).toFixed(2);
      }
      return (
        <div style={{ background: 'white', border: '1px solid #eee', padding: 12, minWidth: 180 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{sub.name}</div>
          <div>Nominal: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(sub.value)}</div>
          <div>Persentase: {percent}%</div>
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
          <Legend layout="horizontal"
          verticalAlign="top"
          align="left"
          iconSize={12}
          fontSize={10}
          wrapperStyle={{fontSize: "12px"}}
           />
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
        {/* Center label for total tahunan kategori dihilangkan */}
      </ResponsiveContainer>
    </div>
  );
}
