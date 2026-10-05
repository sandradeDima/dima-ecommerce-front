const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "em",
  "h1",
  "h2",
  "h3",
  "i",
  "li",
  "ol",
  "p",
  "s",
  "strong",
  "u",
  "ul",
]);

const blockedTags = new Set(["iframe", "object", "script", "style"]);

export function sanitizeRichText(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html");

  const sanitizeChildren = (parent: Node) => {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (blockedTags.has(tag)) {
        element.remove();
        continue;
      }

      if (!allowedTags.has(tag)) {
        sanitizeChildren(element);
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }

      if (tag === "ol" && Array.from(element.children).some((item) => item.getAttribute("data-list") === "bullet")) {
        const list = document.createElement("ul");
        while (element.firstChild) list.append(element.firstChild);
        element.replaceWith(list);
        sanitizeChildren(list);
        continue;
      }

      const href = tag === "a" ? element.getAttribute("href") : null;
      Array.from(element.attributes).forEach(({ name }) => element.removeAttribute(name));

      if (href) {
        try {
          const url = new URL(href, "https://dima.invalid");
          if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
            element.setAttribute("href", href);
          }
        } catch {
          // Ignore malformed link targets.
        }
      }

      sanitizeChildren(element);
    }
  };

  sanitizeChildren(document.body);
  return document.body.textContent?.trim() ? document.body.innerHTML : "";
}

export function richTextPreview(value: string): string {
  const separatedBlocks = value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<\/(?:p|li|h[1-6]|blockquote|div)>/gi, " ");

  if (typeof DOMParser === "undefined") {
    return separatedBlocks.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const document = new DOMParser().parseFromString(separatedBlocks, "text/html");
  document.querySelectorAll("script, style").forEach((element) => element.remove());
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}
