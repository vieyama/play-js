import { type JSX, useState, useRef, useEffect } from 'react';
import { Play, Trash2, Copy, Check } from 'lucide-react';
import { ConsoleItem } from './components/ConsoleItem';
import type { Dependency, LogEntry, LogType } from './types';
import { DependenciesModal } from './components/DependenciesModal';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import dracula from "@/assets/editor-themes/Dracula.json";
import monokai from "@/assets/editor-themes/Monokai.json";
import nightOwl from "@/assets/editor-themes/NightOwl.json";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { editor } from "monaco-editor";
import { Editor, useMonaco, type OnMount } from '@monaco-editor/react';

const customThemes = {
  dracula,
  monokai,
  'night-owl': nightOwl
};

const builtinThemes = ["vs-dark", "vs-light", "hc-black"] as const;
type ThemeKey = keyof typeof customThemes | (typeof builtinThemes)[number];

const themeBackgrounds: Record<ThemeKey, string> = {
  "vs-dark": "#1e1e1e",
  "vs-light": "#ffffff",
  "hc-black": "#000000",
  dracula: dracula.colors["editor.background"] || "#1e1e1e",
  monokai: monokai.colors["editor.background"] || "#272822",
  'night-owl': nightOwl.colors["editor.background"] || "#011627",
};

const defaultCode = `// Write your JavaScript code here
console.log('Hello, World!');

// Try some math
const result = 10 + 20;
console.log('10 + 20 =', result);

// Or use some ES6 features
const numbers = [1, 2, 3, 4, 5];
const objects = {number:1, number2:2}
const arrayObject = [{name: "John"},{name:'Doe'}]
const doubled = numbers.map(n => n * 2);
console.log('Doubled numbers:', doubled);
console.log('Object:', objects);
console.log('Array of objects:', arrayObject);`;

export default function JavaScriptPlayground(): JSX.Element {
  const [code, setCode] = useState<string>(defaultCode);
  const [output, setOutput] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loadedModules, setLoadedModules] = useState<Record<string, unknown>>({});
  const outputCountRef = useRef<number>(0);

  const [theme, setTheme] = useState<ThemeKey>("vs-dark");

  const [editorBg, setEditorBg] = useState(themeBackgrounds[theme]);

  const monaco = useMonaco()

  function handleEditorValidation(markers: editor.IMarker[]) {
    // model markers
    markers.forEach((marker) => console.log("onValidate:", marker.message));
  }


  const handleEditorMount: OnMount = (_, monacoInstance) => {
    Object.entries(customThemes).forEach(([name, data]) => {
      monacoInstance.editor.defineTheme(name, data as editor.IStandaloneThemeData);
    });
    monacoInstance.editor.setTheme(theme);
  };

  const formatOutput = (args: unknown[]): string => {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join('\n');
  };

  const loadDependency = async (dep: Dependency): Promise<void> => {
    try {
      const moduleUrl = `https://cdn.jsdelivr.net/npm/${dep.name}@${dep.version}/+esm`;

      const module = await import(/* @vite-ignore */ moduleUrl);

      const mod = module.default || module;

      // REGISTER this module into your PlayJS runtime
      setLoadedModules(prev => ({
        ...prev,
        [dep.name]: mod
      }));

    } catch (error) {
      console.error(`Failed to load ${dep.name}:`, error);
      throw error;
    }
  };

  const handleAddDependency = async (dep: Dependency): Promise<void> => {
    setDependencies(prev => [...prev, dep]);
    try {
      await loadDependency(dep);
    } catch (error) {
      console.error('Error loading dependency:', error);
    }
  };

  const handleRemoveDependency = (name: string): void => {
    setDependencies(prev => prev.filter(dep => dep.name !== name));
    setLoadedModules(prev => {
      const newModules = { ...prev };
      delete newModules[name];
      return newModules;
    });
  };

  const runCode = (): void => {
    setOutput([]);
    outputCountRef.current = 0;
    const logs: LogEntry[] = [];

    const customConsole = {
      log: (...args: unknown[]) => {
        logs.push({
          type: 'log' as LogType,
          content: formatOutput(args),
          id: outputCountRef.current++
        });
      },
      error: (...args: unknown[]) => {
        logs.push({
          type: 'error' as LogType,
          content: formatOutput(args),
          id: outputCountRef.current++
        });
      },
      warn: (...args: unknown[]) => {
        logs.push({
          type: 'warn' as LogType,
          content: formatOutput(args),
          id: outputCountRef.current++
        });
      }
    };

    try {
      // Create function with all dependencies as parameters
      const moduleNames = Object.keys(loadedModules);
      const moduleValues = Object.values(loadedModules);

      // Build the function
      const func = new Function('console', ...moduleNames, code);

      // Execute the function
      func(customConsole, ...moduleValues);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logs.push({
        type: 'error',
        content: `Error: ${errorMessage}`,
        id: outputCountRef.current++
      });
    }

    setOutput(logs);
  };

  const clearOutput = (): void => {
    setOutput([]);
    outputCountRef.current = 0;
  };

  const copyCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Copy failed:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    if (monaco?.editor) {
      monaco.editor.setTheme(theme);
      setEditorBg(themeBackgrounds[theme]);
    }
  }, [theme, monaco]);

  return (
    <div className="h-screen flex flex-col text-gray-100" style={{ backgroundColor: editorBg }}>
      {/* Header */}
      <div className=" border-gray-700 px-6 py-4" style={{ backgroundColor: editorBg }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${theme === "vs-light"
              ? "bg-linear-to-r from-blue-600 to-purple-600"
              : "bg-linear-to-r from-blue-400 to-purple-400"} bg-clip-text text-transparent`}>
              Play JS
            </h1>
            <p className={`${theme === 'vs-light' ? 'text-gray-600' : 'text-gray-400'} text-sm mt-1`}>Write and execute JavaScript code in real-time</p>
          </div>
          {/*  
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-sm font-medium transition-all hover:shadow-lg"
          >
            <Package size={18} />
            Dependencies {dependencies.length > 0 && `(${dependencies.length})`}
          </button>
          */}
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 flex overflow-hidden"
      >
        <ResizablePanel defaultSize={50}>
          <div className="w-full flex flex-col border-t border-r border-gray-700">
            <div style={{ backgroundColor: editorBg }} className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <span className={`font-semibold ${theme === 'vs-light' ? 'text-gray-500' : 'text-gray-300'}`}>Code Editor</span>
              <div className="flex gap-2">
                <button
                  onClick={copyCode}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 text-sm transition-all hover:shadow-lg"
                  title="Copy code"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={runCode}
                  className="px-3 py-1.5 bg-linear-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded flex items-center gap-2 text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-900/50"
                  title="Run code (Ctrl+Enter)"
                >
                  <Play size={16} />
                  Run
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
            <Editor
              height="75vh"
              onMount={handleEditorMount}
              defaultLanguage="javascript"
              defaultValue={code}
              value={code}
              onValidate={handleEditorValidation}
              onChange={(value) => setCode(value || '')}
              language="javascript"
              theme={'vs-dark'}
              options={{
                renderValidationDecorations: "editable", // ✅ show red squiggles inline
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
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div className="w-full flex flex-col" style={{ backgroundColor: editorBg }}>
            <div style={{ backgroundColor: editorBg }} className="h-[62px] border-t px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <span className={`font-semibold ${theme === 'vs-light' ? 'text-gray-500' : 'text-gray-300'}`}>Console Output</span>
              <button
                onClick={clearOutput}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 text-sm transition-all hover:shadow-lg"
                title="Clear console"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 max-h-[75vh]">
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
        </ResizablePanel>

      </ResizablePanelGroup>



      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 text-xs text-gray-400 flex items-center justify-between">
        <span></span>
        <span className="text-gray-500">
          {output.length} {output.length === 1 ? 'log' : 'logs'}
        </span>
      </div>

      {/* Dependencies Modal */}
      <DependenciesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dependencies={dependencies}
        onAddDependency={handleAddDependency}
        onRemoveDependency={handleRemoveDependency}
      />
    </div>
  );
}