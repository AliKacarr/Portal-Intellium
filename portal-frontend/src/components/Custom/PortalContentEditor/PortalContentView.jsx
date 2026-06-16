import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { looksLikeHtml, syncListMarkerFontSize } from "./portalRichContent";
import "./portalContentEditor.css";

function PortalContentView({ content, className, style }) {
  const rootRef = useRef(null);
  const text = content ?? "";
  const trimmed = String(text).trim();

  useEffect(() => {
    if (rootRef.current && looksLikeHtml(trimmed)) {
      syncListMarkerFontSize(rootRef.current);
    }
  }, [trimmed]);

  if (!trimmed) {
    return null;
  }

  if (looksLikeHtml(trimmed)) {
    return (
      <div
        ref={rootRef}
        className={["portal-rich-content", className].filter(Boolean).join(" ")}
        style={style}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  return (
    <div className={className} style={{ whiteSpace: "pre-wrap", ...style }}>
      {text}
    </div>
  );
}

PortalContentView.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default PortalContentView;
