export interface Article {
  title: string;
  content: string;
  path: string;
  metadata: Record<string, unknown>;
  folder_id?: number;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}
