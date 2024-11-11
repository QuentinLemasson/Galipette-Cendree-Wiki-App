import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
    </div>
  );
};

export default LoadingSpinner;
