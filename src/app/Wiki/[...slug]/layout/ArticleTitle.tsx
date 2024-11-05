import React from "react";

interface ArticleTitleProps {
  title: string;
}

const ArticleTitle: React.FC<ArticleTitleProps> = ({ title }) => {
  return (
    <div
      className="w-full h-10 mb-6 bg-indigo-500 -translate-x-8 flex flex-col items-start"
      style={{
        width: "calc(100% + 64px)",
        clipPath: "polygon(0 0, 98% 0, 100% 50%, 98% 100%, 0% 100%, 1% 50%)",
      }}
    >
      <div className="w-full h-1 bg-indigo-950 translate-y-7 z-0" />
      <h1 className="text-3xl -mt-0.5 ml-6 font-bold text-amber-50 flex items-center bg-indigo-950 h-9 px-4 rounded z-10">
        <div className="mt-0.5">{title}</div>
      </h1>
    </div>
  );
};

export default ArticleTitle;
