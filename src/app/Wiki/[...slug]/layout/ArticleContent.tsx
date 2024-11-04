import React from "react";
import ArticleTitle from "./ArticleTitle";

interface ArticleContentProps {
  title: string;
  content: string;
}

const ArticleContent = ({ title, content }: ArticleContentProps) => {
  return (
    <div className="w-full mt-8">
      {/* Basic styling */}
      <ArticleTitle title={title} />
      {/* Title styling */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {/* Render HTML content */}
    </div>
  );
};

export default ArticleContent; // Export the component
