import { Trash2 } from 'lucide-react';
import { ConsoleItem } from './ConsoleItem';
import type { LogEntry } from '../types';
import type { ThemeKey } from '../constants/themes';

interface ConsolePanelProps {
  output: LogEntry[];
  theme: ThemeKey;
  editorBg: string;
  onClear: () => void;
}

export function ConsolePanel({ output, theme, editorBg, onClear }: ConsolePanelProps) {
  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: editorBg }}>
      <div style={{ backgroundColor: editorBg }} className="min-h-[62px] border-t px-4 py-3 border-b border-gray-700 flex flex-wrap gap-2 items-center justify-between">
        <span className={`font-semibold ${theme === 'vs-light' ? 'text-gray-500' : 'text-gray-300'} text-nowrap`}>Console Output</span>
        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 text-sm transition-all hover:shadow-lg"
          title="Clear console"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {output.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <div className={`text-gray-${theme === 'vs-light' ? '600' : '500'} italic`}>
                No output yet. Click "Run" or press Ctrl+Enter to execute your code.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 font-mono text-sm">
            {output.map((log) => (
              <ConsoleItem key={log.id} log={log} editorBg={editorBg} theme={theme} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
