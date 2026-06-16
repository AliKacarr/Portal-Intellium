import React from "react";
import { Alert, Button, Spin } from "antd";
import { StopOutlined } from "@ant-design/icons";

/**
 * Fiş OCR sırasında tam ekran kilitlemeden bilgi satırı (Form üstü veya alan içi).
 */
const ReceiptExtractStatusBar = ({
  phase,
  elapsedSec = 0,
  titlePreparing,
  titleScanning,
  cancelLabel,
  onCancel,
}) => {
  if (!phase || phase === "idle") return null;
  const isPrep = phase === "preparing";
  return (
    <Alert
      style={{ marginBottom: 12 }}
      type="info"
      showIcon
      message={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Spin size="small" />
          <span>{isPrep ? titlePreparing : titleScanning}</span>
          <span style={{ opacity: 0.85 }}>({elapsedSec}s)</span>
          {typeof onCancel === "function" ? (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={onCancel}
              style={{ padding: 0, height: "auto", fontWeight: 600 }}
            >
              {cancelLabel}
            </Button>
          ) : null}
        </div>
      }
    />
  );
};

export default ReceiptExtractStatusBar;
