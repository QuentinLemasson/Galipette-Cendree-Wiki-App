import { redirect } from 'next/navigation'; 
import { getAllMarkdownFiles } from '@/utils/markdown/getFiles';
import fs from 'fs';
import path from 'path';
import {remark} from 'remark';
import html from 'remark-html';
import Breadcrumbs from '@/components/Breadcumbs';

interface NotePageProps {
  params: Promise<{ slug: string[] }>; // Matches the dynamic route params
}

type NoteContent = Promise<{ content: string; title: string }>

// Define a function to fetch and process note content
async function getNoteContent(slug: string[]): NoteContent {
    const noteDirectory = process.env.NOTE_DIRECTORY || 'src/notes';
    let notePath = path.join(process.cwd(), noteDirectory, ...slug) + '.md';
  
    // Check if the path points to a folder (i.e., no specific .md file)
    if (!fs.existsSync(notePath) && fs.existsSync(path.join(process.cwd(), noteDirectory, ...slug, 'index.md'))) {
      notePath = path.join(process.cwd(), noteDirectory, ...slug, 'index.md');
    }
  
    // Read and process the markdown content with remark
    const content = fs.readFileSync(notePath, 'utf8');
    const processedContent = await remark().use(html).process(content);
    const title = slug[slug.length - 1] || 'Home'; // Set the last slug segment as title, or default to 'Home'
  
    return {
      content: processedContent.toString(),
      title,
    };
  }

// Main NotePage component
export default async function NotePage({ params }: NotePageProps) {

    const {slug} = await params;

 // Redirect if last segment is "index"
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
      return <div>{"404 (oopsie) - il semble que cet article n'existe pas"}</div>; // Customize as needed
  }
}

// Define static params function to generate paths for each markdown file
export async function generateStaticParams() {
    const noteDirectory = process.env.NOTE_DIRECTORY;
    if (!noteDirectory) {
        throw new Error('Error: NOTE_DIRECTORY environment variable is not defined. Please set NOTE_DIRECTORY in your environment.');
    }

    const allMarkdownFiles = getAllMarkdownFiles(noteDirectory);

    return allMarkdownFiles.map((filePath) => ({
      slug: filePath
        .replace(noteDirectory + '/', '') // Remove the base note directory
        .replace(/\.md$/, '') // Remove file extension
        .split('/'), // Split for nested folders
    }));
}