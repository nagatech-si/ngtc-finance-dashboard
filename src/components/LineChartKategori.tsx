import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartKategoriProps {
  data: Array<{ bulan: string; nominal: number }>;
  title?: string;
  description?: string;
}

const CustomLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text x={x} y={y - 10} textAnchor="middle" fontSize={12} fill="#000">
      {`Rp${value.toLocaleString('id-ID')}`}
    </text>
  );
};

export default function LineChartKategori({ data, title, description }: LineChartKategoriProps) {
  return (
    <div className="bg-white">
      {title && <h2 className="text-lg font-bold mb-2">{title}</h2>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <XAxis
            dataKey="bulan"
            interval={0}
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
          {/* <Legend verticalAlign="top" align="right" height={24} iconType="circle" /> */}
          <Line type="monotone" dataKey="nominal" stroke="#0088FE" dot label={<CustomLabel />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
