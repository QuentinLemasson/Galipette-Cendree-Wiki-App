import Link from "next/link";
import { Banner } from "@/components/Banner/Banner";
import { SparklesCursor } from "@/components/SparklesCursor/SparklesCursor";
import { VersionTag } from "@/components/VersionTag/VersionTag";

export default function HomePage() {
  return (
    <div className="cursor-sparkle">
      <SparklesCursor />
      <Banner />
      <main className="max-w-4xl mx-auto pt-16 px-4 mb-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-indigo-500 flex items-center justify-center gap-2">
              <span className="iconify mdi--home" /> La Galipette Cendrée - Wiki
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Une application wiki pour mon jeu de rôle sur table, construite
              dynamiquement à partir d&apos;une vault{" "}
              <Link
                href="https://www.obsidian.md/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Obsidian
              </Link>
              !
            </p>
            <div className="py-2 px-6 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded flex items-center gap-3">
              <span className="iconify mdi--alert text-5xl" />
              Ceci est un build Alpha <br /> D&apos;autres fonctionnalités sont
              à implémenter. Les articles sont (au mieux) des ébauches.
              L&apos;interface est constituée du strict minimum pour que le wiki
              soit fonctionnel.
              <span className="iconify mdi--alert text-5xl" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Consultez quelques articles</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <ArticleCard title="Combat" path="Jeu/Combat" />
              <ArticleCard
                title="Aspects Bestiaux"
                path="Aspects/Aspects_Bestiaux"
              />
              <ArticleCard title="Attributs" path="Personnage/Attributs" />
            </div>
          </section>

          {/* Features Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Fonctionnalités phares</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FeatureCard
                title="Markdown to HTML"
                description="Transforme en pages HTML une collection de fichiers markdown, provenant d'Obsidian ou d'autres sources."
              />
              <FeatureCard
                title="Liens wiki"
                description="Créer des liens entre les articles en utilisant la syntaxe[[wiki-links]]"
              />
              <FeatureCard
                title="Tag & Metadata"
                description="Organiser le contenu avec des tags, et des métadonnées au format frontmatter"
              />
              <FeatureCard
                title="Navigation"
                description="De (trop) nombreuses manières de naviguer : menu latéral, fil d'ariane, articles liés, recherche, liens."
              />
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Tech Stack</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <TechItem name="TypeScript" icon="mdi--language-typescript" />
              <TechItem name="React" icon="mdi--react" />
              <TechItem name="NextJS" icon="vscode-icons--file-type-next" />
              <TechItem name="PostgreSQL" icon="mdi--database" />
              <TechItem
                name="Prisma ORM"
                icon="vscode-icons--file-type-prisma"
              />
              <TechItem name="Tailwind CSS" icon="mdi--tailwind" />
            </div>
          </section>

          {/* Links Section */}
          <section className="space-y-4 justify-self-end">
            <h2 className="text-2xl font-bold">Quick Links</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://github.com/QuentinLemasson/Galipette-Cendree-Wiki-App"
                className="group px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="iconify mdi--github text-x pointer-events-none" />
                Le repo GitHub public
                <span className="iconify mdi--arrow-right text-xl group-hover:translate-x-1 transition-transform pointer-events-none" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <VersionTag />
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function TechItem({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-center text-sm flex items-center justify-center gap-2">
      <span className={`iconify ${icon} text-xl`} />
      {name}
    </div>
  );
}

function ArticleCard({ title, path }: { title: string; path: string }) {
  return (
    <Link
      href={`/Wiki/${path}`}
      className="p-2 border
       bg-indigo-700 border-indigo-800 hover:bg-indigo-800 hover:border-indigo-900 transition-colors 
       rounded-md flex items-center justify-center text-md"
    >
      {title}
    </Link>
  );
}
