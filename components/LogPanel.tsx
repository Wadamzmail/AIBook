import React, { useState, useRef, useEffect } from 'react';

interface LogPanelProps {
  logs: string[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : 'Waiting for AI activity...';

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) {
        scrollToBottom();
    }
  }, [logs, isExpanded]);

  if (!isExpanded) {
    return (
        <div 
            onClick={() => setIsExpanded(true)}
            className="hidden lg:flex fixed bottom-4 right-4 bg-gray-800/90 border border-gray-700 rounded-lg p-3 max-w-sm shadow-2xl cursor-pointer hover:bg-gray-700 transition-colors"
        >
            <p className="text-xs text-gray-300 truncate">
                <span className="text-cyan-400 font-mono mr-2">{`>`}</span>
                {lastLog}
            </p>
        </div>
    );
  }

  return (
    <div className="hidden lg:flex fixed bottom-4 right-4 w-96 h-[60vh] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex-col z-20">
      <div className="flex justify-between items-center p-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-300">AI Action Log</h2>
        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
      <div className="flex-grow bg-gray-900 rounded-b-lg p-3 overflow-y-auto">
        <ul className="space-y-2 text-xs">
          {logs.map((log, index) => (
            <li key={index} className="text-gray-400">
              <span className="text-cyan-400 mr-1.5">{`[${new Date().toLocaleTimeString()}]`}</span>
              {log}
            </li>
          ))}
          <div ref={logsEndRef} />
        </ul>
      </div>
    </div>
  );
};
