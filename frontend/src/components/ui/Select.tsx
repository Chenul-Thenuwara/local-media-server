import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-400 ml-1">{label}:</label>
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-200 focus:outline-none focus:border-apple-blue/50 focus:ring-1 focus:ring-apple-blue/50 transition-all cursor-pointer",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-900 text-gray-200">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
