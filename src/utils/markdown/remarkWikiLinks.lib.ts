import { visit } from "unist-util-visit";
import { Node } from "unist";
import {
  ParentNode,
  RegExpMatchWithIndices,
  TextNode,
  WikiLinkNode,
} from "./remarkWikiLinks.type";

/**
 * Custom remark plugin for wiki-style links
 * @returns
 */
export function remarkWikiLinks() {
  return (tree: Node) => {
    visit(
      tree,
      "text",
      (node: TextNode, index: number | null, parent: ParentNode) => {
        if (!parent || index === null) return;

        // Find all wiki links in the text
        const matches = Array.from(
          node.value.matchAll(/\[\[([^\]]+)\]\]/g)
        ) as RegExpMatchWithIndices[];
        if (matches.length === 0) return;

        // Initialize an array to hold the children nodes
        const children: (TextNode | WikiLinkNode)[] = [];
        let lastIndex = 0;

        // Iterate over each found wiki link to parse it
        matches.forEach(match => {
          const [fullMatch, linkText] = match;
          const startIndex = match.index;

          // Add text content before the link
          if (startIndex > lastIndex) {
            children.push({
              type: "text",
              value: node.value.slice(lastIndex, startIndex),
            } as TextNode);
          }

          // Parse link text (handle potential display text after |)
          const [target, display] = linkText
            .split("|")
            .map((s: string) => s.trim());
          const displayText = display || target;

          // Add the wiki link node
          children.push({
            type: "wikiLink",
            data: {
              hName: "a",
              hProperties: {
                href: `/Wiki/${target.replace(/ /g, "_")}`,
                className: "wiki-link",
              },
            },
            children: [{ type: "text", value: displayText }],
          } as WikiLinkNode);

          lastIndex = startIndex + fullMatch.length;
        });

        // Add remaining text content
        if (lastIndex < node.value.length) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex),
          } as TextNode);
        }

        parent.children.splice(index, 1, ...children);
      }
    );
  };
}
