export interface ArticleTreeItem {
  title: string;
  path: string;
}

export interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  articles: ArticleTreeItem[];
  children?: FolderNode[];
}
