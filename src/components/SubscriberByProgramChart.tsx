import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useState } from 'react';

interface SubscriberByProgramData {
  program: string;
  programs?: string[];
  total_subscriber: number;
  total_biaya: number;
  avg_biaya_per_subscriber: number;
}

interface SubscriberByProgramChartProps {
  data: SubscriberByProgramData[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function SubscriberByProgramChart({ data }: SubscriberByProgramChartProps) {
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
        <div style={{ background: 'white', border: '1px solid #eee', padding: 12, minWidth: 250, fontSize: 13, maxWidth: 400 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{sub.program}</div>
          {sub.programs && sub.programs.length > 1 && (
            <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 4 }}>
              <div style={{ fontSize: 11, fontWeight: '600', marginBottom: 4, color: '#6b7280' }}>Grouped Programs:</div>
              <div style={{ fontSize: 11, color: '#374151' }}>
                {sub.programs.map((prog: string, idx: number) => (
                  <div key={idx} style={{ marginBottom: 2 }}>• {prog}</div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Total Subscribers: {sub.total_subscriber.toLocaleString('id-ID')}</div>
            <div>Total Cost: Rp {sub.total_biaya.toLocaleString('id-ID')}</div>
            <div>Avg Cost/Subscriber: Rp {sub.avg_biaya_per_subscriber.toLocaleString('id-ID')}</div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={160}
            paddingAngle={2}
            dataKey="total_subscriber"
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
            fontSize={11}
            wrapperStyle={{fontSize: "12px", paddingLeft: "20px"}}
            formatter={(value, entry, index) => {
              const itemData = data[index];
              return <span>{value}: <strong style={{fontSize: 13}}>{itemData.total_subscriber.toLocaleString('id-ID')}</strong></span>;
            }}
           />
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}