import React from "react";
import StickerWidget from "../Widgets/Sticker/StickerWidget";

const TicketCount = ({ number, text, icon, fontColor, bgColor, compact }) => {
     return (
          <StickerWidget
               number={number}
               text={text}
               icon={icon}
               fontColor={fontColor}
               bgColor={bgColor}
               compact={compact}
          />
     );
};

export default TicketCount;
