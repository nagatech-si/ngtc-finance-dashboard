import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartKategoriProps {
  data: Array<{ bulan: string; nominal: number }>;
  title?: string;
}

export default function LineChartKategori({ data, title }: LineChartKategoriProps) {
  return (
    <div className="bg-white rounded shadow p-3">
      {title && <h2 className="text-lg font-bold mb-2">{title}</h2>}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <XAxis
            dataKey="bulan"
            interval={0}
            angle={-45}
            dy={10}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            width={100}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.toLocaleString('id-ID')}
            tickCount={6}
          />
          <Tooltip formatter={(value: number, name, props) => [`Rp${value.toLocaleString('id-ID')}`, props.payload.bulan]} />
          <Legend verticalAlign="top" align="right" height={24} iconType="circle" />
          <Line type="monotone" dataKey="nominal" stroke="#0088FE" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
