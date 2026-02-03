import { type JSX, useState, useRef, useEffect } from 'react';
import type { Dependency, LogEntry, LogType } from './types';
import { DependenciesModal } from './components/DependenciesModal';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { themeBackgrounds, type ThemeKey } from '@/constants/themes';
import { Header } from '@/components/Header';
import { EditorPanel } from '@/components/EditorPanel';
import { ConsolePanel } from '@/components/ConsolePanel';
import * as Babel from '@babel/standalone';

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
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  useEffect(() => {
    const checkMobile = () => {
      setDirection(window.innerWidth < 768 ? 'vertical' : 'horizontal');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      // Transpile TypeScript to JavaScript
      const { code: transpiledCode } = Babel.transform(code, {
        presets: ['env', 'typescript'],
        filename: 'file.ts',
      });

      if (!transpiledCode) {
        throw new Error('Transpilation failed');
      }

      // Build the function
      const func = new Function('console', ...moduleNames, transpiledCode);

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
    setEditorBg(themeBackgrounds[theme]);
  }, [theme]);

  return (
    <div className="h-screen flex flex-col text-gray-100" style={{ backgroundColor: editorBg }}>
      {/* Header */}
      <Header theme={theme} editorBg={editorBg} />

      <ResizablePanelGroup
        direction={direction}
        className="flex-1 flex overflow-hidden"
      >
        <ResizablePanel defaultSize={50}>
          <EditorPanel
            code={code}
            setCode={setCode}
            theme={theme}
            setTheme={setTheme}
            onRun={runCode}
            onCopy={copyCode}
            copied={copied}
            editorBg={editorBg}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <ConsolePanel
            output={output}
            theme={theme}
            editorBg={editorBg}
            onClear={clearOutput}
          />
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