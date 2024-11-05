import Link from "next/link";

interface BreadcrumbsProps {
  slug: string[];
  addHome?: boolean;
}

const Breadcrumbs = ({ slug, addHome = false }: BreadcrumbsProps) => {
  let path = "";

  const parts = [...(addHome ? ["Home"] : []), ...slug];

  return (
    // Start of Selection
    <nav
      aria-label="breadcrumb"
      className="text-gray-700 sticky top-0 py-4 backdrop-blur shadow-xl -translate-x-8"
      style={{
        width: "calc(100% + 64px)",
      }}
    >
      <ul className="flex list-none p-0 gap-1 translate-x-8">
        {parts.map((part, index) => {
          if (addHome && index !== 0) path += `/${part}`;
          return (
            <li key={index} className="relative group">
              <Link
                href={addHome && index === 0 ? "/home" : path}
                className={`
                  relative z-10 -skew-x-30 
                  ${index === 0 ? "rounded-l-lg" : ""} 
                  ${index === parts.length - 1 ? "rounded-r-lg text-indigo-500 cursor-default" : ""} 
                  inline-block bg-gray-100 text-gray-700  border border-transparent  
                  px-4 py-1 
                  transform transition-transform duration-300 
                  ${index !== parts.length - 1 ? "hover:text-indigo-500 hover:border-indigo-500 group-hover:-translate-y-1 group-hover:translate-x-1" : ""}
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
