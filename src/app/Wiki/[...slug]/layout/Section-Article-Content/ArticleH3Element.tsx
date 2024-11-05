/* eslint-disable @typescript-eslint/no-explicit-any */
export const ArticleH3Element = ({ children }: { children: any }) => {
  return (
    <h3 className="text-xl font-bold text-slate-900 bg-gray-300 px-2 py1 rounded-md">
      {children}
    </h3>
  );
};
