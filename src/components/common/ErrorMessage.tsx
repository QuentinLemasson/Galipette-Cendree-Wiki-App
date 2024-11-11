import React from "react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className="p-4 text-center">
      <div className="text-red-400 text-sm">{message}</div>
    </div>
  );
};

export default ErrorMessage;
