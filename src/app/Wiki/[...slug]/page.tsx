import { redirect } from "next/navigation";
import { remark } from "remark";
import html from "remark-html";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getArticleByPath, getAllArticlePaths } from "@/utils/db.server";
import ArticleContent from "./layout/ArticleContent";

interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

type ArticleContent = Promise<{ content: string; title: string }>;

async function getArticleContent(slug: string[]): ArticleContent {
  const articlePath = slug.join("/");

  const article = await getArticleByPath(articlePath);
  if (!article) {
    // Check for index.md
    const indexPath = [...slug, "index"].join("/");
    const indexArticle = await getArticleByPath(indexPath);
    if (!indexArticle) throw new Error("Article not found");
    return {
      content: (
        await remark().use(html).process(indexArticle.content)
      ).toString(),
      title: indexArticle.title,
    };
  }

  return {
    content: (await remark().use(html).process(article.content)).toString(),
    title: article.title,
  };
}

// Main ArticlePage component
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const decodedSlug = slug.map((part: string) => decodeURIComponent(part));

  if (decodedSlug[decodedSlug.length - 1].toLowerCase() === "index") {
    const parentSlug = decodedSlug.slice(0, -1).join("/");
    redirect(`/${parentSlug}`);
  }

  try {
    const { content, title } = await getArticleContent(decodedSlug);
    return (
      <div className="max-w-4xl mx-auto mt-4">
        <Breadcrumbs slug={["Home", "Wiki", ...decodedSlug]} />
        <ArticleContent title={title} content={content} />
      </div>
    );
  } catch {
    return <div>{"404 (oopsie) - il semble que cet article n'existe pas"}</div>;
  }
}

export async function generateStaticParams() {
  const paths = await getAllArticlePaths();

  // TODO : try to return the whote content as static params
  return paths.map((filePath: string) => ({
    slug: filePath.replace(/\.md$/, "").split("/"),
  }));
}
