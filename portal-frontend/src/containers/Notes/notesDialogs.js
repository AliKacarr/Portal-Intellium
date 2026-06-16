import React from "react";
import { Input, Modal } from "antd";

export function openTextInputDialog({
  title,
  placeholder,
  initialValue = "",
  okText,
  cancelText,
}) {
  return new Promise((resolve) => {
    let currentValue = String(initialValue ?? "");

    Modal.confirm({
      title,
      icon: null,
      centered: true,
      okText,
      cancelText,
      content: React.createElement(Input, {
        defaultValue: currentValue,
        placeholder,
        autoFocus: true,
        onChange: (event) => {
          currentValue = event.target.value;
        },
      }),
      onOk: () => resolve(String(currentValue).trim() || null),
      onCancel: () => resolve(null),
    });
  });
}

export function openConfirmDialog({
  title,
  content,
  okText,
  cancelText,
  danger = false,
}) {
  return new Promise((resolve) => {
    Modal.confirm({
      title,
      content,
      centered: true,
      okText,
      cancelText,
      okButtonProps: danger ? { danger: true } : undefined,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}
