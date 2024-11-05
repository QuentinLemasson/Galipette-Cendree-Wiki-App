import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
// import rehypeRewrite from "rehype-rewrite";
import rehypeReact from "rehype-react";
// import rehypeStringify from "rehype-stringify";
import { ArticlePElement } from "@/app/Wiki/[...slug]/layout/ArticlePElement";
import React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArticleH2Element } from "@/app/Wiki/[...slug]/layout/ArticleH2Element";
import { ArticleH3Element } from "@/app/Wiki/[...slug]/layout/ArticleH3Element";
import { ArticleLinkElement } from "@/app/Wiki/[...slug]/layout/ArticleLinkElement";

import { Schema } from "/rehype-sanitize/lib";
import { remarkWikiLinks } from "./remarkWikiLinks.lib";

// Define sanitization schema
const sanitizationSchema: Schema = {
  attributes: {
    a: ["className", "href", "target", "rel"],
  },
};

// Create the unified parser with all the plugins for remark and rehype
const mardownParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkWikiLinks)
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

/**
 * Processes markdown content and converts it into React elements.
 *
 * @param {string} content - The markdown content to process.
 * @returns {Promise<React.ReactNode>} The resulting React elements or the original content if an error occurs.
 */
export async function processArticleContent(
  content: string
): Promise<React.ReactNode> {
  try {
    const reactContent = await mardownParser.process(content);
    return reactContent.result;
  } catch (error) {
    console.error(":cross_mark: Error processing article content", error);
    return content;
  }
}
