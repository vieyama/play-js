import type { ThemeKey } from "@/constants/themes";

interface HeaderProps {
    theme: ThemeKey;
    editorBg: string;
}

export function Header({ theme, editorBg }: HeaderProps) {
    return (
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
        </div>
      </div>
    );
}
