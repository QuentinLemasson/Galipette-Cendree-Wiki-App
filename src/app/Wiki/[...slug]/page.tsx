import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleContent from "./layout/Section-Article-Content/ArticleContent";
import { processArticleContent } from "@/utils/markdown/parseArticleContent";
import { RelatedArticlesContainer } from "./layout/Section-Related-Articles/RelatedArticlesContainer";
import { RecentArticlesWrapper } from "./layout/Section-Recent-Articles/RecentArticlesWrapper";
import { Article } from "types/db.types";
import { Banner } from "@/components/Banner/Banner";
import {
  getArticleByPath,
  getArticlePaths,
  getFolderTree,
} from "@/data/articles";
import { FolderTree } from "./layout/Section-Navigation/FolderTree";

interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const decodedSlug = slug.map((part: string) => decodeURIComponent(part));

  // Fetch folder tree data
  const folderTree = await getFolderTree();

  // If the last part of the slug is "index", redirect to the parent folder
  if (decodedSlug[decodedSlug.length - 1].toLowerCase() === "index") {
    const parentSlug = decodedSlug.slice(0, -1).join("/");
    redirect(`/Wiki/${parentSlug}`);
  }

  // Fetch the article and its related articles from the API
  try {
    const article = await getArticleByPath(decodedSlug.join("/"));

    if (!article) {
      return <div>404 - Article not found</div>;
    }

    const {
      title,
      content,
      path,
      related_articles = [],
      mention_articles = [],
    } = article;

    // Process the article content from markdown to React components
    const processedContent = await processArticleContent(
      content,
      related_articles
    );

    // Fuse related and mention articles into one array and remove duplicates
    const allRelatedArticles = Array.from(
      new Set([
        ...related_articles.map((article: Article) => article.path),
        ...mention_articles.map((article: Article) => article.path),
      ])
    )
      .map(path => {
        const relatedArticle = [...related_articles, ...mention_articles].find(
          article => article.path === path
        );
        return relatedArticle ? { ...relatedArticle } : null;
      })
      .filter(article => article !== null);

    return (
      <>
        <Banner />
        <div className="relative max-w-4xl mx-auto pt-12">
          <div className="flex gap-8">
            <aside className="fixed left-4 top-28">
              <FolderTree initialData={folderTree} />
            </aside>
            <section className="w-full">
              <Breadcrumbs slug={["Wiki", ...decodedSlug]} addHome />
              <ArticleContent title={title} content={processedContent} />
            </section>
            <aside className="fixed right-16 top-28 flex flex-col">
              <RecentArticlesWrapper currentArticle={{ title, path }} />
              {allRelatedArticles?.length > 0 && (
                <RelatedArticlesContainer
                  title="Articles liés"
                  articleList={allRelatedArticles}
                />
              )}
            </aside>
          </div>
        </div>
      </>
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
    const articles = await getArticlePaths();
    return articles.map(article => ({
      slug: article.path.replace(/\.md$/, "").split("/"),
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}
