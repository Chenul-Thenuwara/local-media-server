import { useEffect, useState } from 'react';
import { Folder, HardDrive, ChevronRight, CornerLeftUp } from 'lucide-react';
import { Button } from './Button';
import api from '../../lib/api';

interface FileSystemItem {
  name: string;
  path: string;
  type?: 'folder' | 'drive';
}

interface FolderPickerProps {
  onSelect: (path: string) => void;
  onCancel: () => void;
}

export function FolderPicker({ onSelect, onCancel }: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  const fetchItems = async (path: string) => {
    setLoading(true);
    try {
      if (!path) {
        const res = await api.get('/system/drives');
        setItems(res.data);
      } else {
        const res = await api.get(`/system/directories?path=${encodeURIComponent(path)}`);
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to browse', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUp = () => {
    if (!currentPath) return; // Already at drives
    // Simple up logic: remove last segment
    // D:/Videos/Movies -> D:/Videos
    // D:/ -> "" (Back to drives)
    const normalized = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    const lastSlash = normalized.lastIndexOf('/');

    if (lastSlash === -1 || (normalized.length === 2 && normalized.endsWith(':'))) {
      // e.g. "D:" or "D" -> Go to drives
      setCurrentPath('');
    } else {
      setCurrentPath(normalized.substring(0, lastSlash + 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#1c1c1e] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleUp} disabled={!currentPath} className="text-gray-400 hover:text-white">
            <CornerLeftUp size={20} />
          </Button>
          <div className="flex-1 font-mono text-sm text-gray-300 truncate">
            {currentPath || 'This PC'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
          ) : (
            <>
              {items.length === 0 && <div className="text-center text-gray-500 py-10">Empty Folder</div>}

              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => setCurrentPath(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left group transition-colors"
                >
                  {currentPath === '' ? (
                    <HardDrive size={20} className="text-apple-blue" />
                  ) : (
                    <Folder size={20} className="text-yellow-500" />
                  )}
                  <span className="flex-1 text-gray-200 group-hover:text-white truncate">{item.name}</span>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400" />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!currentPath}
            onClick={() => onSelect(currentPath)}
            className="bg-apple-blue hover:bg-blue-600"
          >
            Select This Folder
          </Button>
        </div>
      </div>
    </div>
  );
}
