
import React from 'react';

const DebugInfo: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 p-2 bg-yellow-100 text-xs border border-yellow-300 z-50">
      <div>Debug Info:</div>
      <div>URL: {window.location.href}</div>
      <div>React Version: {React.version}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default DebugInfo;
