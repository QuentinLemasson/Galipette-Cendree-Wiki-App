import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ArticleContent from "./layout/Section-Article-Content/ArticleContent";
import { processArticleContent } from "@/utils/markdown/parseArticleContent";
import { RelatedArticlesContainer } from "./layout/Section-Related-Articles/RelatedArticlesContainer";
import { RecentArticlesWrapper } from "./layout/Section-Recent-Articles/RecentArticlesWrapper";
import { Article } from "@/database/types/db.types";
import { Banner } from "@/components/Banner/Banner";
import {
  getArticleByPath,
  getArticlePaths,
  getFolderTree,
} from "@/database/utils/articles";
import { FolderTree } from "./layout/Section-Navigation/FolderTree";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { VersionTag } from "@/components/VersionTag/VersionTag";
import { EmptyArticle } from "@/components/ui/EmptyArticle";

const handleArticleLoading = async (
  path: string
): Promise<{
  article: Article | null;
  processedContent: React.ReactNode;
  allRelatedArticles: Article[];
} | null> => {
  const article: Article | null = await getArticleByPath(path);

  if (!article) {
    return null;
  }

  const processedContent = await processArticleContent(
    article.content,
    article.related_articles
  );

  // Fuse related and mention articles into one array and remove duplicates
  const allRelatedArticles = Array.from(
    new Set([
      ...article.related_articles.map((article: Article) => article.path),
      ...article.mention_articles.map((article: Article) => article.path),
    ])
  )
    .map(path => {
      const relatedArticle = [
        ...article.related_articles,
        ...article.mention_articles,
      ].find(article => article.path === path);
      return relatedArticle ? { ...relatedArticle } : null;
    })
    .filter(article => article !== null);

  return {
    article,
    processedContent,
    allRelatedArticles,
  };
};

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
    const processedArticle = await handleArticleLoading(decodedSlug.join("/"));

    return (
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <Banner />
          <div className="flex flex-1">
            <Sidebar
              className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
              side="left"
              variant="inset"
            >
              <SidebarContent
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <FolderTree initialData={folderTree} />
              </SidebarContent>
            </Sidebar>

            {/* Main Content */}
            <SidebarInset className="px-16 relative">
              <Breadcrumbs slug={["Wiki", ...decodedSlug]} addHome />
              <SidebarTrigger side="left" className="absolute top-1 left-1" />
              <SidebarTrigger side="right" className="absolute top-1 right-1" />
              {processedArticle && processedArticle.article ? (
                <ArticleContent
                  title={processedArticle.article.title}
                  content={processedArticle.processedContent}
                />
              ) : (
                <EmptyArticle
                  path={decodedSlug.join("/")}
                  parentPath={
                    decodedSlug.length > 1
                      ? decodedSlug.slice(0, -1).join("/")
                      : ""
                  }
                />
              )}
            </SidebarInset>

            <Sidebar
              className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
              side="right"
              variant="inset"
            >
              <SidebarContent>
                <RecentArticlesWrapper
                  currentArticle={{
                    title: decodedSlug[decodedSlug.length - 1],
                    path: decodedSlug.join("/"),
                  }}
                />
                {processedArticle &&
                  (processedArticle?.allRelatedArticles?.length ?? 0) > 0 && (
                    <RelatedArticlesContainer
                      title="Articles liés"
                      articleList={processedArticle.allRelatedArticles}
                    />
                  )}
              </SidebarContent>
            </Sidebar>
          </div>
        </SidebarProvider>
        <VersionTag />
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
    const articles = await getArticlePaths();
    return articles.map(article => ({
      slug: article.path.replace(/\.md$/, "").split("/"),
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}
