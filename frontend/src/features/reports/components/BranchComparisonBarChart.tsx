// Eje X → branchName
// Barra 1 → totalSales
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
    branchId: string;
    branchName: string;
    totalSales: number;
    totalAmount: number;
  }[];
}

export function BranchComparisonBarChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="branchName"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="totalSales"
            name="Ventas"
            fill="#111827"
          />

          <Bar
            dataKey="totalAmount"
            name="Ingresos"
            fill="#2563eb"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
