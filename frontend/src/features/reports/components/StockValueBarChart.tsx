// Lo usamos así:
// Eje Y → name
// Barra → valuation (valor monetario)
// Tooltip → stock + valor

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
    totalStock: number;
    inventoryValue: number;
  }[];
}

export function StockValueBarChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis type="number" />

          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={120}
          />

          <Tooltip
            formatter={(value, name, props) => {
              if (name === 'inventoryValue') {
                return [`$${value}`, 'Valor'];
              }
              return [value, name];
            }}
          />

          <Legend />

          <Bar
            dataKey="inventoryValue"
            name="Valor en stock"
            fill="#16a34a" // verde
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
