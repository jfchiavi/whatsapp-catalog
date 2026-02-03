// Eje X → name
// Barra 1 → quantitySold
// Barra 2 → revenue

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  data: {
    productId: string;
    name: string;
    quantitySold: number;
    totalRevenue: number;
  }[];
}

export function TopProductsBarChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="quantitySold"
            name="Cantidad vendida"
            fill="#111827"
          />

          <Bar
            dataKey="totalRevenue"
            name="Ingresos"
            fill="#2563eb"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
