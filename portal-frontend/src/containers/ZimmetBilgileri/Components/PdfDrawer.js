import React from "react";
import { useIntl } from "react-intl";

//Ant design
import { Drawer } from "antd";
//==== Ant design ==== 
//Data
import pdfFile from "../data/files/Zimmet_Tutanagi.pdf";
//==== Data
const PdfDrawer = ({ open, setOpen }) => {
  const intl = useIntl();
  const onClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Drawer
        title={intl.formatMessage({ id: "zimmetBilgileri.pdfDrawerTitle" })}
        placement="right"
        onClose={onClose}
        open={open}
        size="large"
      >
        <object
          data={pdfFile}
          style={{ height: "100%", width: "100%" }}
          type="application/pdf"
          title={intl.formatMessage({ id: "zimmetBilgileri.pdfDrawerTitle" })}
          aria-label={intl.formatMessage({ id: "zimmetBilgileri.pdfDrawerTitle" })}
        />
      </Drawer>
    </>
  );
};
export default PdfDrawer;
