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
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tree } from "@/components/ui/tree";
interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

const data = [
  {
    label: "Spells",
    path: "Spells",
    menus: [
      {
        label: "Evocation",
        path: "Evocation",
        menus: [],
        items: [
          {
            label: "Fireball",
            path: "Fireball",
          },
          {
            label: "Thunderbolt",
            path: "Thunderbolt",
          },
        ],
      },
      {
        label: "Necromancy",
        path: "Necromancy",
        menus: [],
        items: [
          {
            label: "Raise Dead",
            path: "Raise Dead",
          },
          {
            label: "Summon",
            path: "Summon",
          },
        ],
      },
    ],
    items: [
      {
        label: "Sourcery",
        path: "Sourcery",
      },
      {
        label: "Divine Magic",
        path: "Divine Magic",
      },
      {
        label: "Arcane Magic",
        path: "Arcane Magic",
      },
    ],
  },
  {
    label: "Classes",
    path: "Classes",
    menus: [],
    items: [
      {
        label: "Wizard",
        path: "Wizard",
      },
      {
        label: "Cleric",
        path: "Cleric",
      },
      {
        label: "Paladin",
        path: "Paladin",
      },
      {
        label: "Rogue",
        path: "Rogue",
      },
    ],
  },
  {
    label: "Monsters",
    path: "Monsters",
    menus: [
      {
        label: "Beast",
        path: "Beast",
        menus: [
          {
            label: "Jungle",
            path: "Jungle",
            menus: [],
            items: [
              {
                label: "Jungle Behemoth",
                path: "Jungle Behemoth",
              },
              {
                label: "Jungle Elemental",
                path: "Jungle Elemental",
              },
            ],
          },
          {
            label: "Desert",
            path: "Desert",
            menus: [],
            items: [
              {
                label: "Giant Scorpion",
                path: "Giant Scorpion",
              },
              {
                label: "Sandworm",
                path: "Sandworm",
              },
              {
                label: "Sand Elemental",
                path: "Sand Elemental",
              },
            ],
          },
        ],
        items: [],
      },
      {
        label: "Demon",
        path: "Demon",
        menus: [],
        items: [
          {
            label: "Demon Lord",
            path: "Demon Lord",
          },
          {
            label: "Demon",
            path: "Demon",
          },
        ],
      },
      {
        label: "Undead",
        path: "Undead",
        menus: [],
        items: [
          {
            label: "Skeleton",
            path: "Skeleton",
          },
          {
            label: "Zombie",
            path: "Zombie",
          },
          {
            label: "Ghoul",
            path: "Ghoul",
          },
          {
            label: "Vampire",
            path: "Vampire",
          },
        ],
      },
    ],
    items: [],
  },
];

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
      <div className="[--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <Banner />
          <div className="flex flex-1">
            <Sidebar
              className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
              side="left"
              variant="inset"
            >
              <SidebarContent>
                <FolderTree initialData={folderTree} />
                <Tree items={data} />
              </SidebarContent>
            </Sidebar>

            {/* Main Content */}
            <SidebarInset className="px-16 relative">
              <Breadcrumbs slug={["Wiki", ...decodedSlug]} addHome />
              <SidebarTrigger side="left" className="absolute top-1 left-1" />
              <SidebarTrigger side="right" className="absolute top-1 right-1" />
              <ArticleContent title={title} content={processedContent} />
            </SidebarInset>

            <Sidebar
              className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
              side="right"
              variant="inset"
            >
              <SidebarContent>
                <RecentArticlesWrapper currentArticle={{ title, path }} />
                {allRelatedArticles?.length > 0 && (
                  <RelatedArticlesContainer
                    title="Articles liés"
                    articleList={allRelatedArticles}
                  />
                )}
              </SidebarContent>
            </Sidebar>
          </div>
        </SidebarProvider>
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
