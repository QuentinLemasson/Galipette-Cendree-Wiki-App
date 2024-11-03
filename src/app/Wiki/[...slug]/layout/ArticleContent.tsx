import React from "react";

interface ArticleContentProps {
  title: string;
  content: string;
}

const ArticleContent = ({ title, content }: ArticleContentProps) => {
  return (
    <div className="w-full mt-8">
      {/* Basic styling */}
      <h1 className="text-2xl font-bold mb-4 text-gray-300">{title}</h1>
      {/* Title styling */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {/* Render HTML content */}
    </div>
  );
};

export default ArticleContent; // Export the component
