import { Editor, type OnMount } from '@monaco-editor/react';
import type { editor } from "monaco-editor";
import { Play, Copy, Check } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { builtinThemes, customThemes, type ThemeKey } from '@/constants/themes';

interface EditorPanelProps {
  code: string;
  setCode: (code: string) => void;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  onRun: () => void;
  onCopy: () => void;
  copied: boolean;
  editorBg: string;
}

export function EditorPanel({
  code,
  setCode,
  theme,
  setTheme,
  onRun,
  onCopy,
  copied,
  editorBg
}: EditorPanelProps) {

  function handleEditorValidation(markers: editor.IMarker[]) {
    markers.forEach((marker) => console.log("onValidate:", marker.message));
  }

  const handleEditorMount: OnMount = (_, monacoInstance) => {
    Object.entries(customThemes).forEach(([name, data]) => {
      monacoInstance.editor.defineTheme(name, data as editor.IStandaloneThemeData);
    });
  };

  return (
    <div className="w-full h-full flex flex-col border-t border-r border-gray-700">
      <div style={{ backgroundColor: editorBg }} className="px-4 py-3 border-b border-gray-700 flex flex-wrap gap-2 items-center justify-between">
        <span className={`font-semibold ${theme === 'vs-light' ? 'text-gray-500' : 'text-gray-300'} text-nowrap`}>Code Editor</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCopy}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 text-sm transition-all hover:shadow-lg"
            title="Copy code"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={onRun}
            className="px-3 py-1.5 bg-linear-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded flex items-center gap-2 text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-900/50"
            title="Run code (Ctrl+Enter)"
          >
            <Play size={16} />
            <span className="hidden sm:inline">Run</span>
          </button>
          <Select
            onValueChange={(value) => setTheme(value as ThemeKey)}
            value={theme}
          >
            <SelectTrigger className={`w-[120px] ${theme === 'vs-light' ? 'text-gray-800' : 'text-gray-100'}`}>
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup title="Built-in">
                {builtinThemes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup title="Custom">
                {Object.keys(customThemes).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          onMount={handleEditorMount}
          defaultLanguage="typescript"
          defaultValue={code}
          value={code}
          onValidate={handleEditorValidation}
          onChange={(value) => setCode(value || '')}
          language="typescript"
          theme={theme}
          options={{
            renderValidationDecorations: "editable",
            colorDecorators: true,
            wordBasedSuggestions: 'allDocuments',
            tabCompletion: "on",
            fixedOverflowWidgets: true,
            scrollBeyondLastLine: false,
            "semanticHighlighting.enabled": true,
            fontSize: 12,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            wrappingIndent: 'indent',
            tabSize: 2,
            insertSpaces: true,
            roundedSelection: true,
            readOnly: false,
            contextmenu: true,
            dragAndDrop: true,
            showDeprecated: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnType: true,
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}
