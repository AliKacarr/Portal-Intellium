export const PORTAL_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];

export function escapeHtml(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toEditorHtml(content = "") {
  if (!content) return "<p><br></p>";
  const hasHtml = /<\s*[a-z][\s\S]*>/i.test(content);
  if (hasHtml) return content;

  return content
    .split("\n")
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"))
    .join("");
}

/** İçerik HTML mi yoksa düz metin mi */
export function looksLikeHtml(value) {
  if (value == null) return false;
  const s = String(value).trim();
  if (!s) return false;
  return /<[a-z][\s\S]*>/i.test(s);
}

export function stripHtmlTags(html) {
  if (html == null) return "";
  const s = String(html);
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(s, "text/html");
    return (doc.body.textContent || "").replace(/\u00a0/g, " ");
  }
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const LI_BODY_CLASS = "portal-li-body";

/** Her madde: [işaret] + [metin gövdesi] — contentEditable içinde çakışmayı önler */
export function normalizeListItems(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("ol li, ul li").forEach((li) => {
    let body = li.querySelector(`:scope > .${LI_BODY_CLASS}`);
    if (!body) {
      body = document.createElement("span");
      body.className = LI_BODY_CLASS;
      while (li.firstChild) {
        body.appendChild(li.firstChild);
      }
      li.appendChild(body);
      return;
    }
    while (li.firstChild && li.firstChild !== body) {
      body.insertBefore(li.firstChild, body.firstChild);
    }
  });
}

/** Madde içindeki en büyük yazı boyutunu yalnızca numara / madde işaretine yansıtır */
export function syncListMarkerFontSize(root) {
  if (!root?.querySelectorAll) return;
  normalizeListItems(root);
  root.querySelectorAll("ol li, ul li").forEach((li) => {
    li.style.removeProperty("font-size");
    li.style.removeProperty("line-height");
    li.style.removeProperty("padding-left");

    let maxPx = 0;
    let markerSize = "";
    const body = li.querySelector(`:scope > .${LI_BODY_CLASS}`) || li;
    body.querySelectorAll("[style*='font-size']").forEach((el) => {
      const px = parseInt(el.style?.fontSize, 10);
      if (!Number.isNaN(px) && px > maxPx) {
        maxPx = px;
        markerSize = el.style.fontSize;
      }
    });

    if (markerSize) {
      li.style.setProperty("--list-marker-font-size", markerSize);
    } else {
      li.style.removeProperty("--list-marker-font-size");
    }
  });
}

export function getRichContentPreview(html, maxLength = 220) {
  const text = stripHtmlTags(html).replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function validateRichContentRequired(message) {
  return (_, value) => {
    const text = stripHtmlTags(value).trim();
    if (!text) return Promise.reject(new Error(message));
    return Promise.resolve();
  };
}
