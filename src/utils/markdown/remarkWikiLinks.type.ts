export interface TextNode extends Node {
  type: "text";
  value: string;
}

export interface WikiLinkNode extends Node {
  type: "wikiLink";
  data: {
    hName: string;
    hProperties: {
      href: string;
      className: string;
    };
  };
  children: TextNode[];
}

export interface ParentNode extends Node {
  children: (TextNode | WikiLinkNode)[];
}

export interface RegExpMatchWithIndices extends RegExpMatchArray {
  index: number;
}
