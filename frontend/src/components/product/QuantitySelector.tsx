interface Props {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export const QuantitySelector = ({ value, onChange, max = 99 }: Props) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => value > 1 && onChange(value - 1)}
        className="w-8 h-8 border rounded"
      >
        −
      </button>

      <span className="w-8 text-center">{value}</span>

      <button
        onClick={() => value < max && onChange(value + 1)}
        className="w-8 h-8 border rounded"
      >
        +
      </button>
    </div>
  );
};
