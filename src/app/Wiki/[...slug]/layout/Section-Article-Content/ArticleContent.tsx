import React from "react";
import ArticleTitle from "./ArticleTitle";

interface ArticleContentProps {
  title: string;
  content: React.ReactNode;
}

const ArticleContent = ({ title, content }: ArticleContentProps) => {
  return (
    <div className="w-full mt-4 flex flex-col gap-4 items-start mb-8">
      {/* Basic styling */}
      <ArticleTitle title={title} />
      {/* Title styling */}
      {content}
      {/* Render HTML content */}
    </div>
  );
};

export default ArticleContent; // Export the component
