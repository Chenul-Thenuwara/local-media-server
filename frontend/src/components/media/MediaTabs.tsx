
import { cn } from '../../lib/utils';
import { Image, Cloud } from 'lucide-react';

interface MediaTabsProps {
  activeTab: 'local' | 'google';
  onTabChange: (tab: 'local' | 'google') => void;
}

export function MediaTabs({ activeTab, onTabChange }: MediaTabsProps) {
  return (
    <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-lg w-fit">
      <button
        onClick={() => onTabChange('local')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          activeTab === 'local'
            ? "bg-apple-blue text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Image size={16} />
        Local Library
      </button>
      <button
        onClick={() => onTabChange('google')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          activeTab === 'google'
            ? "bg-apple-blue text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Cloud size={16} />
        Google Photos
      </button>
    </div>
  );
}
