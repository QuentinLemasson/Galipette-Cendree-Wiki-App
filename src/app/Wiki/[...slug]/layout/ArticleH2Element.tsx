/* eslint-disable @typescript-eslint/no-explicit-any */
export const ArticleH2Element = ({ children }: { children: any }) => {
  return (
    <h2 className="w-full mt-4 text-2xl font-bold border-b-2 border-gray-300">
      {children}
    </h2>
  );
};
