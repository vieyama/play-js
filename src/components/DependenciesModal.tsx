import type { Dependency, NPMSearchResult } from "@/types";
import { Package, X, Search, Loader2, Check, Plus } from "lucide-react";
import { useRef, useState, type JSX } from "react";

// Dependencies Modal Component
export function DependenciesModal({
    isOpen,
    onClose,
    dependencies,
    onAddDependency,
    onRemoveDependency
}: {
    isOpen: boolean;
    onClose: () => void;
    dependencies: Dependency[];
    onAddDependency: (dep: Dependency) => void;
    onRemoveDependency: (name: string) => void;
}): JSX.Element | null {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Dependency[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string>('');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchPackages = async (query: string): Promise<void> => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setSearchError('');

        try {
            const response = await fetch(
                `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`
            );

            if (!response.ok) {
                throw new Error('Failed to search packages');
            }

            const data = await response.json() as { objects: NPMSearchResult[] };
            const results: Dependency[] = data.objects.map((item) => ({
                name: item.package.name,
                version: item.package.version,
                description: item.package.description || 'No description available',
                url: item.package.links.npm
            }));

            setSearchResults(results);
        } catch (error) {
            setSearchError('Failed to search packages. Please try again.');
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (value: string): void => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchPackages(value);
        }, 500);
    };

    const isInstalled = (name: string): boolean => {
        return dependencies.some(dep => dep.name === name);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <Package className="text-blue-400" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-gray-100">Manage Dependencies</h2>
                            <p className="text-sm text-gray-400 mt-0.5">Search and add npm packages</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search npm packages (e.g., lodash, axios, date-fns)..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" size={20} />
                        )}
                    </div>
                    {searchError && (
                        <p className="text-red-400 text-sm mt-2">{searchError}</p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Installed Dependencies */}
                    {dependencies.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                                Installed ({dependencies.length})
                            </h3>
                            <div className="space-y-2">
                                {dependencies.map((dep) => (
                                    <div
                                        key={dep.name}
                                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold text-blue-400">{dep.name}</span>
                                                <span className="text-xs text-gray-500">v{dep.version}</span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">{dep.description}</p>
                                        </div>
                                        <button
                                            onClick={() => onRemoveDependency(dep.name)}
                                            className="ml-4 p-2 hover:bg-red-900/30 rounded transition-colors"
                                            title="Remove dependency"
                                        >
                                            <X size={18} className="text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchQuery && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                                Search Results
                            </h3>
                            {searchResults.length === 0 && !isSearching ? (
                                <p className="text-gray-500 text-center py-8">
                                    {searchError ? 'Failed to load results' : 'No packages found'}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((pkg) => (
                                        <div
                                            key={pkg.name}
                                            className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-gray-100">{pkg.name}</span>
                                                    <span className="text-xs text-gray-500">v{pkg.version}</span>
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{pkg.description}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    onAddDependency(pkg);
                                                    setSearchQuery('');
                                                    setSearchResults([]);
                                                }}
                                                disabled={isInstalled(pkg.name)}
                                                className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${isInstalled(pkg.name)
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    }`}
                                            >
                                                {isInstalled(pkg.name) ? (
                                                    <>
                                                        <Check size={16} />
                                                        Installed
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={16} />
                                                        Add
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!searchQuery && dependencies.length === 0 && (
                        <div className="text-center py-12">
                            <Package size={48} className="text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">No dependencies yet</h3>
                            <p className="text-gray-500">Search for npm packages to add them to your playground</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}