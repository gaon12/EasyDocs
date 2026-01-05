export type HighlightResult = {
  count: number;
  firstMatch: HTMLElement | null;
};

type HighlightRoot = Document | HTMLElement;

const IGNORED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);

const getContainer = (root: HighlightRoot) =>
  root instanceof Document ? root.body : root;

export const clearHighlights = (root: HighlightRoot) => {
  const container = getContainer(root);
  if (!container) return;
  const marks = container.querySelectorAll("mark[data-highlight='true']");
  marks.forEach((mark) => {
    const text = mark.ownerDocument.createTextNode(mark.textContent ?? "");
    mark.replaceWith(text);
    text.parentElement?.normalize();
  });
};

export const applyHighlights = (
  root: HighlightRoot,
  query: string,
): HighlightResult => {
  const container = getContainer(root);
  if (!container) {
    return { count: 0, firstMatch: null };
  }

  clearHighlights(root);

  const needle = query.trim();
  if (!needle) {
    return { count: 0, firstMatch: null };
  }

  const doc = root instanceof Document ? root : root.ownerDocument;
  if (!doc) {
    return { count: 0, firstMatch: null };
  }

  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (IGNORED_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest("mark[data-highlight='true']")) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  const needleLower = needle.toLowerCase();
  let count = 0;
  let firstMatch: HTMLElement | null = null;

  for (const node of textNodes) {
    const text = node.nodeValue ?? "";
    const lower = text.toLowerCase();
    let index = lower.indexOf(needleLower);

    if (index === -1) continue;

    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;

    while (index !== -1) {
      if (index > lastIndex) {
        fragment.append(text.slice(lastIndex, index));
      }

      const mark = doc.createElement("mark");
      mark.dataset.highlight = "true";
      mark.textContent = text.slice(index, index + needle.length);
      if (!firstMatch) {
        firstMatch = mark;
      }
      fragment.append(mark);
      count += 1;

      lastIndex = index + needle.length;
      index = lower.indexOf(needleLower, lastIndex);
    }

    if (lastIndex < text.length) {
      fragment.append(text.slice(lastIndex));
    }

    node.parentNode?.replaceChild(fragment, node);
  }

  return { count, firstMatch };
};
