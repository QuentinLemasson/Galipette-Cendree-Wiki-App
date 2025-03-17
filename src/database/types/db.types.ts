import { ArticleTag } from "@prisma/client";

export interface Article {
  title: string;
  content: string;
  path: string;
  metadata: Record<string, unknown>;
  folder_id?: number;
  related_articles: Article[];
  mention_articles: Article[];
  tags?: ArticleTag[];
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}
