import Link from "next/link";

interface BreadcrumbsProps {
  slug: string[];
}

const Breadcrumbs = ({ slug }: BreadcrumbsProps) => {
  let path = "/wiki"; // Initialize path with "/wiki" as the base

  return (
    <nav aria-label="breadcrumb">
      <ul style={{ display: "flex", listStyle: "none", padding: 0 }}>
        <li>
          <Link href="/">Home</Link> /{" "}
        </li>
        <li>
          <Link href="/Wiki">Wiki</Link> /{" "}
        </li>
        {slug.map((part, index) => {
          path += `/${part}`;
          return (
            <li key={index}>
              <Link href={path}>{part}</Link>
              {index < slug.length - 1 ? " / " : ""}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
