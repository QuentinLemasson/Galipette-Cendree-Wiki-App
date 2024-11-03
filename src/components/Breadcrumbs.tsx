import Link from "next/link";

interface BreadcrumbsProps {
  slug: string[];
}

const Breadcrumbs = ({ slug }: BreadcrumbsProps) => {
  let path = "/wiki"; // Initialize path with "/wiki" as the base

  return (
    <nav aria-label="breadcrumb" className="text-gray-700">
      <ul className="flex list-none p-0 gap-1">
        {slug.map((part, index) => {
          path += `/${part}`;
          return (
            <li key={index} className="relative group">
              <Link
                href={path}
                className={`
                  relative z-10 -skew-x-30 
                  ${index === 0 ? "rounded-l-lg" : ""} 
                  ${index === slug.length - 1 ? "rounded-r-lg text-gray-400 cursor-default" : ""} 
                  inline-block bg-gray-100 text-gray-700  border border-transparent  
                  px-4 py-1 
                  transform transition-transform duration-300 
                  ${index !== slug.length - 1 ? "hover:text-indigo-500 hover:border-indigo-500 group-hover:-translate-y-1 group-hover:translate-x-1" : ""}
                `}
              >
                <div className="skew-x-30">{part}</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
