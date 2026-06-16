import React, { useState } from "react";
import { Button } from "antd";
import Popover from "./uielements/popover";
import ColorChooserDropdown from "./ColorChooser.style";

export default function ({ colors, seectedColor, changeColor }) {
  const [isOpen, setIsOpen] = useState(false);

  // Modalı kapatma fonksiyonu
  function hide() {
    setIsOpen(false);
  }

  // Açık/Kapalı durumunu değiştiren fonksiyon
  function handleOpenChange() {
    setIsOpen((open) => !open);
  }
  const content = () => (
    <ColorChooserDropdown className="isoColorOptions">
      {colors.map((color, index) => {
        const onClick = () => {
          hide();
          changeColor(index);
        };
        const style = {
          background: color,
        };
        return <Button key={index} onClick={onClick} style={style} />;
      })}
    </ColorChooserDropdown>
  );
  return (
    <Popover
      content={content()}
      trigger="click"
      open={isOpen}
      onCancel={handleOpenChange}
      onOk={handleOpenChange}
    >
      <Button
        style={{ backgroundColor: colors[seectedColor] }}
        className="isoColorChooser"
      />
    </Popover>
  );
}
