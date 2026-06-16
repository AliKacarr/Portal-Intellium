export const AGREEMENT_TYPES = {
  KVKK: 1,
  ACIK_RIZA: 2,
};

export const normalizeApiList = (response) => {
  const payload = response?.data?.data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

export const getAgreementByType = (agreements, type) => {
  return agreements.find((agreement) => Number(agreement.type ?? agreement.Type) === type) || null;
};

export const parseAgreementContent = (content) => {
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join(" ").trim();
    if (text) blocks.push({ type: blocks.length === 0 ? "title" : "p", text });
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  (content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line) => {
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      if (line.startsWith("*")) {
        flushParagraph();
        listItems.push(line.replace(/^\*\s*/, ""));
        return;
      }

      flushList();
      paragraphLines.push(line);
    });

  flushParagraph();
  flushList();

  return blocks;
};
