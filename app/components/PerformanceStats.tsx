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
    <div className="mb-8 csgo-card p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-semibold text-white flex items-center">
          <span className="text-xl mr-2">📊</span> Performance Stats
        </h3>
        <div className="text-sm text-blue-400 font-medium">{formattedTime} total</div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-box">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Total Time</div>
            <div className="text-xs text-purple-400">API</div>
          </div>
          <div className="text-lg text-white font-medium">{formattedTime}</div>
        </div>
        <div className="stat-box">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Songs</div>
            <div className="text-xs text-blue-400">Database</div>
          </div>
          <div className="text-lg text-white font-medium">{songCount}</div>
        </div>
        <div className="stat-box">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">Producers</div>
            <div className="text-xs text-green-400">Results</div>
          </div>
          <div className="text-lg text-white font-medium">{producerCount}</div>
        </div>
      </div>
    </div>
  );
} 