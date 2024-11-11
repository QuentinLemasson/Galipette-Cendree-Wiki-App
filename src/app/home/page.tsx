import Link from "next/link";
import { Banner } from "@/components/Banner/Banner";

export default function HomePage() {
  return (
    <>
      <Banner />
      <main className="max-w-4xl mx-auto pt-16 px-4">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-indigo-500">
              La Galipette Cendrée - Wiki <span className="iconify mdi--home" />
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              A modern wiki system for tabletop role-playing games, built with
              Next.js and PostgreSQL
            </p>
            <div className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-lg">
              ⚠️ Alpha Build - Features and UI are subject to change
            </div>
          </section>

          {/* Features Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Features</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FeatureCard
                title="Markdown Support"
                description="Write content in Markdown with YAML frontmatter for metadata"
              />
              <FeatureCard
                title="Wiki-style Links"
                description="Create internal links between articles using [[wiki-links]]"
              />
              <FeatureCard
                title="Tag System"
                description="Organize content with tags and categories"
              />
              <FeatureCard
                title="Search"
                description="Full-text search across all articles"
              />
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Tech Stack</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <TechItem name="TypeScript" />
              <TechItem name="React" />
              <TechItem name="Next.js 14" />
              <TechItem name="PostgreSQL" />
              <TechItem name="Prisma ORM" />
              <TechItem name="Tailwind CSS" />
            </div>
          </section>

          {/* Links Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Quick Links</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://github.com/yourusername/wiki-galipette-cendree"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
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

function TechItem({ name }: { name: string }) {
  return (
    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-center text-sm">
      {name}
    </div>
  );
}
