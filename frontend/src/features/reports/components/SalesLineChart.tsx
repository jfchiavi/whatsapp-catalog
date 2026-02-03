// 2 ejes Y:
// Izquierda → cantidad de ventas
// Derecha → ingresos

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  data: {
    date: string;
    totalSales: number;
    totalAmount: number;
  }[];
}

export function SalesLineChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
          />

          <Tooltip />

          <Legend />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalSales"
            name="Ventas"
            stroke="#111827" // gris oscuro
            strokeWidth={2}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalAmount"
            name="Ingresos"
            stroke="#2563eb" // azul
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
