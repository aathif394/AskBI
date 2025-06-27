import { useState } from "react";

interface SuggestedQueriesProps {
  suggestions: string[];
  loading: boolean;
  onSelect: (query: string) => void;
}

export default function SuggestedQueries({
  suggestions,
  loading,
  onSelect,
}: SuggestedQueriesProps) {
  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="border-t border-slate-200 bg-white py-4 px-6">
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg
              className="w-4 h-4 animate-spin text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Fetching suggestions...</span>
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm font-medium text-slate-600">
              Suggested Queries
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {suggestions.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect(query)}
                  className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 text-left text-sm text-slate-800 hover:shadow-md hover:border-slate-300 transition"
                >
                  {query}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
