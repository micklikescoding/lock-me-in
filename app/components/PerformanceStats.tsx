'use client';

interface PerformanceStatsProps {
  totalTimeMs: number;
  songCount: number;
  producerCount: number;
}

export default function PerformanceStats({
  totalTimeMs,
  songCount,
  producerCount,
}: PerformanceStatsProps) {
  // Format the time in seconds with 2 decimal places
  const formattedTime = (totalTimeMs / 1000).toFixed(2) + 's';

  return (
    <div className="mb-8 bg-gray-800 rounded-lg p-3 border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Performance Stats</h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-xs text-gray-400">Total Time</div>
          <div className="text-lg text-white">{formattedTime}</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-xs text-gray-400">Songs Analyzed</div>
          <div className="text-lg text-white">{songCount}</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-xs text-gray-400">Producers Found</div>
          <div className="text-lg text-white">{producerCount}</div>
        </div>
      </div>
    </div>
  );
} 