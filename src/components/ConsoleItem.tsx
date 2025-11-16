import type { ConsoleItemProps } from "@/types";
import type { JSX } from "react";
import ReactJson from '@microlink/react-json-view'

// Console Output Item Component
export function ConsoleItem({ log, theme, editorBg }: ConsoleItemProps): JSX.Element {
    const renderValue = (value: string): JSX.Element[] => {
        const parts = value.split('\n');

        return parts.map((part, idx) => {
            try {
                const parsed: unknown = JSON.parse(part);
                if (typeof parsed === 'object' && parsed !== null) {
                    return <div key={idx} className="inline-block">
                        <ReactJson
                            src={parsed}
                            indentWidth={4}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            onAdd={false}
                            onEdit={false}
                            onDelete={false}
                            theme={theme === 'vs-light' ? 'shapeshifter:inverted' : 'tomorrow'}
                        />
                    </div>;
                }
            } catch (e) {
                // Not JSON, continue with regular rendering
            }

            if (typeof part === 'string') {
                if (part === 'true' || part === 'false') {
                    return <span key={idx} className="text-amber-500 font-semibold">{part} </span>;
                }
                if (!isNaN(Number(part)) && part.trim() !== '') {
                    return <span key={idx} className="text-lime-500 font-semibold">{part} </span>;
                }
                if (part === 'null' || part === 'undefined') {
                    return <span key={idx} className="text-purple-500 italic font-semibold">{part} </span>;
                }
                return <span key={idx} className={`${log.type === 'error'
                    ? 'text-red-500'
                    : log.type === 'warn'
                        ? 'text-yellow-500'
                        : `text-gray-${theme === 'vs-light' ? '500' : '100'}`
                    }`}>{part} </span>;
            }

            return <span key={idx} className={`text-gray-${theme === 'vs-light' ? '500' : '100'}`}>{String(part)} </span>;
        });
    };

    return (
        <div
            className={`p-2 bg-[${editorBg}] border border-gray-700 rounded-lg`}
        >
            <div className="flex items-start gap-2">
                <div className="flex gap-2 overflow-x-auto">
                    {renderValue(log.content)}
                </div>
            </div>

            <style>
                {`
                .react-json-view .object-content {
                    background: ${editorBg} !important;
                }
                `}
            </style>
        </div>
    );
}