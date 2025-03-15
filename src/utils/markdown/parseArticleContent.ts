import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
// import rehypeRewrite from "rehype-rewrite";
import rehypeReact from "rehype-react";
// import rehypeStringify from "rehype-stringify";
import { ArticlePElement } from "@/app/Wiki/[...slug]/layout/Section-Article-Content/ArticlePElement";
import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArticleH2Element } from "@/app/Wiki/[...slug]/layout/Section-Article-Content/ArticleH2Element";
import { ArticleH3Element } from "@/app/Wiki/[...slug]/layout/Section-Article-Content/ArticleH3Element";
import { ArticleLinkElement } from "@/app/Wiki/[...slug]/layout/Section-Article-Content/ArticleLinkElement";

import { Schema } from "/rehype-sanitize/lib";
import { remarkWikiLinks } from "./remarkWikiLinks.lib";
import { Article } from "db/types/db.types";

// Define sanitization schema
const sanitizationSchema: Schema = {
  attributes: {
    a: ["className", "href", "target", "rel"],
  },
};

/**
 * Processes markdown content and converts it into React elements.
 *
 * @param {string} content - The markdown content to process.
 * @returns {Promise<React.ReactNode>} The resulting React elements or the original content if an error occurs.
 */
export async function processArticleContent(
  content: string,
  relatedArticles: Article[]
): Promise<React.ReactNode> {
  try {
    const mardownParser = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkWikiLinks, { relatedArticles })
      .use(remarkRehype)
      .use(rehypeSanitize, sanitizationSchema)
      .use(rehypeReact, {
        jsx,
        jsxs,
        createElement: React.createElement,
        Fragment: React.Fragment,
        components: {
          p: ArticlePElement,
          h2: ArticleH2Element,
          h3: ArticleH3Element,
          a: ArticleLinkElement,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

    const reactContent = await mardownParser.process(content);
    return reactContent.result;
  } catch (error) {
    console.error(":cross_mark: Error processing article content", error);
    return content;
  }
}
