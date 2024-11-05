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

export async function processArticleContent(content: string) {
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize)
      // .use(rehypeRewrite, {
      //   selector: "a",
      //   rewrite: async node => rewriteLinkNodes(node, linkNodeMapping, currSlug),
      // })
      .use(rehypeReact, {
        createElement: React.createElement,
        Fragment: React.Fragment,
        components: {
          p: ArticlePElement,
          h2: ArticleH2Element,
          h3: ArticleH3Element,
        },
        jsx,
        jsxs,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      // .use(rehypeStringify)
      .process(content);
    // const htmlStr = file.toString();
    console.log(file.result);
    return file.result;
  } catch (error) {
    console.error(":cross_mark: Error processing article content", error);
    return content;
  }
}
