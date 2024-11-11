export const removeRootFolderFromPath = (path: string) => {
  return path.replace(new RegExp(`${process.env.WIKI_DIRECTORY}/`), "");
};
