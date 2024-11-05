import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleContent from "./layout/ArticleContent";
import { processArticleContent } from "@/utils/markdown/parseArticleContent";

interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const decodedSlug = slug.map((part: string) => decodeURIComponent(part));

  // If the last part of the slug is "index", redirect to the parent folder
  if (decodedSlug[decodedSlug.length - 1].toLowerCase() === "index") {
    const parentSlug = decodedSlug.slice(0, -1).join("/");
    redirect(`/${parentSlug}`);
  }

  // Fetch the article from the API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/articles/path/${decodedSlug.join("/")}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        return <div>404 - Article not found</div>;
      }
      throw new Error("Failed to fetch article");
    }

    const article = await response.json();

    const { title, content } = article;

    // Process the content to HTML
    const processedContent = await processArticleContent(content);

    return (
      <div className="max-w-4xl mx-auto mt-4">
        <Breadcrumbs slug={["Wiki", ...decodedSlug]} addHome />
        <ArticleContent title={title} content={processedContent} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching article:", error);
    return <div>500 - Internal Server Error</div>;
  }
}

export async function generateStaticParams() {
  console.log("----------------------------------------");
  console.log("🔄 Generating static params for Wiki...");
  console.log("----------------------------------------");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/articlepaths`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch article paths");
    }
    const articles: { path: string }[] = await response.json();

    return articles.map(article => ({
      slug: article.path.replace(/\.md$/, "").split("/"),
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}
