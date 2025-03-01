'use client';

interface PerformanceStatsProps {
  totalTimeMs?: number;
  songCount?: number;
  producerCount?: number;
}

export default function PerformanceStats({ 
  totalTimeMs, 
  songCount,
  producerCount 
}: PerformanceStatsProps) {
  if (!totalTimeMs) return null;
  
  return (
    <div className="mt-4 mb-8 p-3 bg-gray-800 rounded-lg text-xs">
      <h3 className="font-medium text-gray-400 mb-2">Performance Stats</h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-700 p-2 rounded">
          <div className="text-gray-400">Total Time</div>
          <div className="text-white font-medium">{(totalTimeMs / 1000).toFixed(2)}s</div>
        </div>
        {songCount !== undefined && (
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Songs Analyzed</div>
            <div className="text-white font-medium">{songCount}</div>
          </div>
        )}
        {producerCount !== undefined && (
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400">Producers Found</div>
            <div className="text-white font-medium">{producerCount}</div>
          </div>
        )}
      </div>
    </div>
  );
} 