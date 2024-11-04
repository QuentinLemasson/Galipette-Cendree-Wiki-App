import React from "react";

interface ArticleTitleProps {
  title: string;
}

const ArticleTitle: React.FC<ArticleTitleProps> = ({ title }) => {
  return (
    <div className="w-full relative h-8 mb-4">
      <div
        className="absolute top-0 -right-6 -left-6 bottom-0 bg-indigo-500"
        style={{
          clipPath: "polygon(0 0, 98% 0, 100% 50%, 98% 100%, 0% 100%, 1% 50%)",
        }}
      />
      <div className="absolute -right-6 -left-6 bottom-2 h-1 bg-slate-950 " />
      <h1 className="absolute text-2xl font-bold mb-4 text-amber-50">
        <div className="bg-slate-950 h-6 mt-1 px-4 -skew-x-12"></div>
        <div className="-translate-y-7 px-2">{title}</div>
      </h1>
    </div>
  );
};

export default ArticleTitle;
