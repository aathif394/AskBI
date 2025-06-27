// // import { Button } from "@/components/ui/button";
// // import { Code, Table, PlayCircle, Loader2 } from "lucide-react";

// // type Props = {
// //   editableSql: string;
// //   setEditableSql: (val: string) => void;
// //   queryError: any;
// //   queryResult: any;
// //   showData: boolean;
// //   setShowData: (b: boolean) => void;
// //   onRun: () => void;
// //   running: boolean;
// // };

// // export default function QueryControls({
// //   editableSql,
// //   setEditableSql,
// //   queryError,
// //   queryResult,
// //   showData,
// //   setShowData,
// //   onRun,
// //   running,
// // }: Props) {
// //   return (
// //     <div className="bg-white rounded-xl shadow-md border border-slate-200 mt-8 overflow-hidden">
// //       {/* Header */}
// //       <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
// //         <div className="flex items-center gap-2">
// //           <Code className="w-4 h-4 text-slate-500" />
// //           <span className="text-sm font-semibold text-slate-800">
// //             Generated SQL
// //           </span>
// //         </div>
// //         <div className="flex items-center gap-3">
// //           {queryResult && (
// //             <Button
// //               variant="ghost"
// //               size="sm"
// //               onClick={() => setShowData(!showData)}
// //               className="text-sm text-slate-600 hover:text-slate-800"
// //             >
// //               <Table className="w-4 h-4 mr-1" />
// //               {showData ? "Hide Data" : "View Data"}
// //             </Button>
// //           )}
// //           <Button
// //             variant="ghost"
// //             size="sm"
// //             onClick={onRun}
// //             disabled={running || !editableSql.trim()}
// //             className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center"
// //           >
// //             {running ? (
// //               <Loader2 className="w-4 h-4 mr-1 animate-spin" />
// //             ) : (
// //               <PlayCircle className="w-4 h-4 mr-1" />
// //             )}
// //             {running ? "Running..." : "Run SQL"}
// //           </Button>
// //         </div>
// //       </div>

// //       {/* SQL Editor */}
// //       <textarea
// //         value={editableSql}
// //         onChange={(e) => setEditableSql(e.target.value)}
// //         rows={6}
// //         className="w-full bg-slate-100 px-5 py-4 text-sm font-mono leading-relaxed text-slate-800 outline-none border-none resize-none"
// //       />

// //       {/* Status Messages */}
// //       {queryError && (
// //         <div className="px-5 py-3 text-sm text-red-700 bg-red-50 border-t border-red-200">
// //           Error: {queryError.message}
// //         </div>
// //       )}
// //       {queryResult && (
// //         <div className="px-5 py-3 text-sm text-green-700 bg-green-50 border-t border-green-200">
// //           Query executed in {queryResult.execution_time_ms} ms
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Code, Table, PlayCircle, Loader2 } from "lucide-react";
// import useVega from "@/hooks/useVega";

// type Props = {
//   editableSql: string;
//   setEditableSql: (val: string) => void;
//   queryError: any;
//   queryResult: any; // must contain `query_id`
//   showData: boolean;
//   setShowData: (b: boolean) => void;
//   onRun: () => void;
//   running: boolean;
// };

// export default function QueryControls({
//   editableSql,
//   setEditableSql,
//   queryError,
//   queryResult,
//   showData,
//   setShowData,
//   onRun,
//   running,
// }: Props) {
//   const [vegaSpec, setVegaSpec] = useState<any>(null);
//   const [isGeneratingViz, setIsGeneratingViz] = useState(false);
//   const vegaRef = useVega(vegaSpec);

//   useEffect(() => {
//     if (queryResult?.query_id) {
//       setIsGeneratingViz(true); // <-- move this here
//       fetch(`http://localhost:8000/visualize?query_id=${queryResult.query_id}`)
//         .then((res) => res.json())
//         .then((data) => {
//           if (data.status === "success" && data.spec) {
//             setVegaSpec(data.spec);
//           } else {
//             setVegaSpec(null);
//             console.warn("No Vega spec returned:", data.message);
//           }
//         })
//         .catch((err) => {
//           console.error("Failed to fetch Vega spec:", err);
//           setVegaSpec(null);
//         })
//         .finally(() => {
//           setIsGeneratingViz(false); // <-- always reset spinner
//         });
//     }
//   }, [queryResult?.query_id]);

//   return (
//     <div className="bg-white rounded-xl shadow-md border border-slate-200 mt-8 overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
//         <div className="flex items-center gap-2">
//           <Code className="w-4 h-4 text-slate-500" />
//           <span className="text-sm font-semibold text-slate-800">
//             Generated SQL
//           </span>
//         </div>
//         <div className="flex items-center gap-3">
//           {queryResult && (
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => setShowData(!showData)}
//               className="text-sm text-slate-600 hover:text-slate-800"
//             >
//               <Table className="w-4 h-4 mr-1" />
//               {showData ? "Hide Data" : "View Data"}
//             </Button>
//           )}
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={onRun}
//             disabled={running || !editableSql.trim()}
//             className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center"
//           >
//             {running ? (
//               <Loader2 className="w-4 h-4 mr-1 animate-spin" />
//             ) : (
//               <PlayCircle className="w-4 h-4 mr-1" />
//             )}
//             {running ? "Running..." : "Run SQL"}
//           </Button>
//         </div>
//       </div>

//       {/* SQL Editor */}
//       <textarea
//         value={editableSql}
//         onChange={(e) => setEditableSql(e.target.value)}
//         rows={6}
//         className="w-full bg-slate-100 px-5 py-4 text-sm font-mono leading-relaxed text-slate-800 outline-none border-none resize-none"
//       />

//       {/* Status Messages */}
//       {queryError && (
//         <div className="px-5 py-3 text-sm text-red-700 bg-red-50 border-t border-red-200">
//           Error: {queryError.message}
//         </div>
//       )}
//       {queryResult && (
//         <div className="px-5 py-3 text-sm text-green-700 bg-green-50 border-t border-green-200">
//           Query executed in {queryResult.execution_time_ms} ms
//         </div>
//       )}

//       {/* Visualization */}
//       {isGeneratingViz && queryResult ? (
//         // Show spinner
//         <div className="flex items-center gap-2 text-sm text-slate-500 px-5 py-6 border-t border-slate-200 bg-white">
//           <svg
//             className="w-4 h-4 animate-spin text-slate-400"
//             fill="none"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             />
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//             />
//           </svg>
//           <span>Generating Visualizations...</span>
//         </div>
//       ) : vegaSpec ? (
//         // Show visualization
//         <div className="px-5 py-6 border-t border-slate-200 bg-white">
//           <h3 className="text-sm font-semibold text-slate-800 mb-2">
//             Visualization
//           </h3>
//           <div ref={vegaRef} className="overflow-auto min-h-[300px]" />
//         </div>
//       ) : (
//         // Fallback
//         <div className="px-5 py-6 border-t border-slate-200 bg-white">
//           <h3 className="text-sm font-semibold text-slate-800 mb-2">
//             Run SQL to generate visualizations...
//           </h3>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, Table, PlayCircle, Loader2, Wrench } from "lucide-react";
import useVega from "@/hooks/useVega";

type Props = {
  editableSql: string;
  setEditableSql: (val: string) => void;
  queryError: any;
  queryResult: any;
  showData: boolean;
  setShowData: (b: boolean) => void;
  onRun: () => void;
  running: boolean;
  question: string;
};

export default function QueryControls({
  editableSql,
  setEditableSql,
  queryError,
  queryResult,
  showData,
  setShowData,
  onRun,
  running,
  question,
}: Props) {
  const [vegaSpec, setVegaSpec] = useState<any>(null);
  const [isGeneratingViz, setIsGeneratingViz] = useState(false);
  const [fixing, setFixing] = useState(false);
  const vegaRef = useVega(vegaSpec);

  useEffect(() => {
    if (queryResult?.query_id) {
      setIsGeneratingViz(true);
      fetch(`http://localhost:8000/visualize?query_id=${queryResult.query_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success" && data.spec) {
            setVegaSpec(data.spec);
          } else {
            setVegaSpec(null);
            console.warn("No Vega spec returned:", data.message);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch Vega spec:", err);
          setVegaSpec(null);
        })
        .finally(() => {
          setIsGeneratingViz(false);
        });
    }
  }, [queryResult?.query_id]);

  const handleFixSql = async () => {
    setFixing(true);
    try {
      const res = await fetch("http://localhost:8000/fix_sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          broken_sql: editableSql,
          error_message: queryError?.message ?? "",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setEditableSql(data.fixed_sql);
      } else {
        console.error("Fix failed:", data.message);
      }
    } catch (err) {
      console.error("Fix request failed:", err);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 mt-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">
            Generated SQL
          </span>
        </div>
        <div className="flex items-center gap-3">
          {queryResult && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowData(!showData)}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              <Table className="w-4 h-4 mr-1" />
              {showData ? "Hide Data" : "View Data"}
            </Button>
          )}
          {(queryError || queryResult?.rows === 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFixSql}
              disabled={fixing}
              className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center"
            >
              {fixing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4 mr-1" />
              )}
              {fixing ? "Fixing..." : "Fix SQL"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            disabled={running || !editableSql.trim()}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center"
          >
            {running ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-1" />
            )}
            {running ? "Running..." : "Run SQL"}
          </Button>
        </div>
      </div>

      {/* SQL Editor */}
      <textarea
        value={editableSql}
        onChange={(e) => setEditableSql(e.target.value)}
        rows={6}
        className="w-full bg-slate-100 px-5 py-4 text-sm font-mono leading-relaxed text-slate-800 outline-none border-none resize-none"
      />

      {/* Status Messages */}
      {queryError && (
        <div className="px-5 py-3 text-sm text-red-700 bg-red-50 border-t border-red-200">
          Error: {queryError.message}
        </div>
      )}
      {queryResult && (
        <div className="px-5 py-3 text-sm text-green-700 bg-green-50 border-t border-green-200">
          Query executed in {queryResult.execution_time_ms} ms
        </div>
      )}

      {/* Visualization */}
      {isGeneratingViz && queryResult ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 px-5 py-6 border-t border-slate-200 bg-white">
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
          <span>Generating Visualizations...</span>
        </div>
      ) : vegaSpec ? (
        <div className="px-5 py-6 border-t border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Visualization
          </h3>
          <div ref={vegaRef} className="overflow-auto min-h-[300px]" />
        </div>
      ) : (
        <div className="px-5 py-6 border-t border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Run SQL to generate visualizations...
          </h3>
        </div>
      )}
    </div>
  );
}
