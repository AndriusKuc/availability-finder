import { Minus, Plus } from '@/components/icons';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  label,
}: NumberStepperProps) {
  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease"
        >
          <Minus size={18} />
        </button>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-14 text-center font-semibold text-gray-900 border-x border-gray-300 py-2 focus:outline-none"
          aria-label="Number value"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase"
        >
          <Plus size={18} />
        </button>
      </div>
      {label && <span className="text-gray-600 font-medium">{label}</span>}
    </div>
  );
}
