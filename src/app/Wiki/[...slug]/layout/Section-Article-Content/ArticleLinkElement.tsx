import Link from "next/link";

interface ArticleLinkElementProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const ArticleLinkElement = ({
  href,
  children,
  className,
}: ArticleLinkElementProps) => {
  // Only use Next.js Link for internal wiki links
  if (className === "wiki-link") {
    return (
      <Link
        href={href}
        className="text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        {children}
      </Link>
    );
  }

  // Regular anchor tag for external links
  return (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
