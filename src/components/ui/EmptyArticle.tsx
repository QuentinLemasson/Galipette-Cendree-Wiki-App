import React from "react";
import Link from "next/link";
import { Button } from "./button";
import { FolderOpen, FileQuestion, Edit, ArrowLeft } from "lucide-react";

interface EmptyArticleProps {
  path: string;
  parentPath?: string;
}

/**
 * EmptyArticle - A component displayed when an article is not found
 * Provides information about the missing article and navigation options
 */
export const EmptyArticle: React.FC<EmptyArticleProps> = ({
  path,
  parentPath,
}) => {
  console.log("EmptyArticle", path, parentPath);
  // Extract folder name from path
  const folderName = (path.split("/").pop() || path).replace(/_/g, " ");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-muted/30 p-8 rounded-xl border border-muted-foreground/20 shadow-sm max-w-2xl w-full">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <FileQuestion className="h-20 w-20 text-muted-foreground/70" />
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
              <FolderOpen className="h-5 w-5" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Article non trouvé
        </h1>
        <h2 className="text-xl font-semibold mb-6 text-muted-foreground">
          &ldquo;{folderName}&rdquo;
        </h2>

        <div className="bg-card p-4 rounded-lg mb-6 text-left">
          <p className="mb-4 text-card-foreground">
            Cet article n&apos;a pas encore été rédigé. Voici quelques options :
          </p>
          <ul className="list-disc pl-5 space-y-2 text-card-foreground/80">
            <li>
              Créez cet article en écrivant un fichier{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">
                index.md
              </code>
            </li>
            <li>
              Alertez{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">
                Quentin
              </code>{" "}
              sur l&apos;indisponibilité de l&apos;article
            </li>
            <li>Explorez d&apos;autres sections du wiki </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {parentPath && (
            <Link href={`/Wiki/${parentPath}`} passHref>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="italic">{`Wiki/${parentPath}`}</span>
              </Button>
            </Link>
          )}
          <Link href="/Wiki" passHref>
            <Button variant="default" className="gap-2">
              <Edit className="h-4 w-4" />
              Explorer le Wiki
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
