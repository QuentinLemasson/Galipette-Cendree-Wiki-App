export const removeRootFolderFromPath = (path: string) => {
  return path.replace(
    new RegExp(
      `${process.env.VAULT_PATH?.split("\\")[process.env.VAULT_PATH?.split("\\").length - 1]}/`
    ),
    ""
  );
};
