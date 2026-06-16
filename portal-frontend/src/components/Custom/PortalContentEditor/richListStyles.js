/** Liste: numara solda (flex), metin sağda — karışık yazı boyutunda çakışma olmaz */
export const richListCss = `
  ul,
  ol {
    margin: 0 0 14px 0;
    padding-left: 0;
    min-width: 0;
  }

  ul {
    list-style: none;
  }

  ol {
    list-style: none;
    counter-reset: ol-list;
  }

  ul li,
  ol li {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.4em;
    margin-bottom: 8px;
    padding: 0;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  ol li {
    counter-increment: ol-list;
  }

  ol li::before {
    content: counter(ol-list) ".";
    flex: 0 0 auto;
    min-width: 1.6em;
    text-align: right;
    font-size: var(--list-marker-font-size, 1em);
    line-height: 1.35;
    color: #6b7280;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  ul li::before {
    content: "−";
    flex: 0 0 auto;
    min-width: 0.75em;
    text-align: center;
    font-size: var(--list-marker-font-size, 1em);
    line-height: 1.35;
    color: #6b7280;
    font-weight: 600;
  }

  li .portal-li-body {
    flex: 1 1 auto;
    min-width: 0;
    line-height: 1.35;
  }
`;
