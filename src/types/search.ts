export interface SearchResult {
  title: string;
  path: string;
  content: string;
  tags: { tag: { name: string } }[];
}
