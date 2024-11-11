export const VersionTag = () => {
  return (
    <div className="text-sm text-gray-500 dark:text-gray-500 italic fixed bottom-2 right-2">
      Build alpha - {process.env.REACT_APP_VERSION}
    </div>
  );
};
