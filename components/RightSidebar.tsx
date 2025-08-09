
import React, { useRef, useEffect } from 'react';

interface RightSidebarProps {
  logs: string[];
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ logs }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [logs]);

  return (
    <aside className="fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-gray-800 p-4 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-300 mb-4 flex-shrink-0">AI Action Log</h2>
      <div className="flex-grow bg-gray-900 rounded-lg p-3 overflow-y-auto">
        <ul className="space-y-2 text-xs">
          {logs.map((log, index) => (
            <li key={index} className="text-gray-400 animate-fade-in">
              <span className="text-cyan-400 mr-1.5">{`[${new Date().toLocaleTimeString()}]`}</span>
              {log}
            </li>
          ))}
          <div ref={logsEndRef} />
        </ul>
      </div>
    </aside>
  );
};
