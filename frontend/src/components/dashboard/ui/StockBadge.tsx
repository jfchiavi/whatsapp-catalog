interface Props {
    quantity: number;
    min?: number;
}


export const StockBadge = ({ quantity, min = 0 }: Props) => {
    const isLow = quantity <= min;

    return (
        <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
        isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}
        >
        {quantity} {isLow && '⚠️'}
        </span>
    );
};