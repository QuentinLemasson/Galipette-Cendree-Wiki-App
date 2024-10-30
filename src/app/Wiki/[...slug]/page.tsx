import { redirect } from 'next/navigation';
import { remark } from 'remark';
import html from 'remark-html';
import Breadcrumbs from '@/components/Breadcumbs';
import { getNoteByPath, getAllNotePaths } from '@/utils/db';

interface NotePageProps {
  params: Promise<{ slug: string[] }>;
}

type NoteContent = Promise<{ content: string; title: string }>;

// Define a function to fetch and process note content
async function getNoteContent(slug: string[]): NoteContent {
  // Convert slug array to path format matching the database - always use forward slashes
  const notePath = slug.join('/') + '.md';
  
  console.log(`Fetching note by path: ${notePath}`);
  const note = await getNoteByPath(notePath);
  if (!note) {
    console.log(`Note not found: ${notePath}`);
    // Check for index.md
    const indexPath = [...slug, 'index'].join('/') + '.md';
    console.log(`Checking index: ${indexPath}`);
    const indexNote = await getNoteByPath(indexPath);
    if (!indexNote) throw new Error('Note not found');
    return {
      content: (await remark().use(html).process(indexNote.content)).toString(),
      title: indexNote.title,
    };
  }
  console.log(`Note found: ${note.title}`);

  return {
    content: (await remark().use(html).process(note.content)).toString(),
    title: note.title,
  };
}

// Main NotePage component
export default async function NotePage({ params }: NotePageProps) {
  const { slug } = await params;

  if (slug[slug.length - 1].toLowerCase() === 'index') {
    const parentSlug = slug.slice(0, -1).join('/');
    redirect(`/${parentSlug}`);
  }

  try {
    const { content, title } = await getNoteContent(slug);
    return (
      <div>
        <Breadcrumbs slug={slug} />
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  } catch {
    return <div>{"404 (oopsie) - il semble que cet article n'existe pas"}</div>;
  }
}

// Update static params to use database
export async function generateStaticParams() {
  const paths = await getAllNotePaths();
  
  return paths.map((filePath: string) => ({
    slug: filePath
      .replace(/\.md$/, '')
      .split('/'),
  }));
} 