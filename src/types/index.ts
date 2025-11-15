export type LogType = 'log' | 'error' | 'warn';

export interface LogEntry {
    type: LogType;
    content: string;
    id: number;
}

export interface JSONTreeViewerProps {
    data: unknown;
    level?: number;
    label?: string | null;
}

export interface ConsoleItemProps {
    log: LogEntry;
    theme: string;
    editorBg: string;
}

export interface Dependency {
    name: string;
    version: string;
    description: string;
    url: string;
}

export interface NPMSearchResult {
    package: {
        name: string;
        version: string;
        description: string;
        links: {
            npm: string;
        };
    };
}
