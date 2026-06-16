import React from "react";
import { useIntl } from "react-intl";
import { Drawer } from "antd";

import pdfFile from "../data/files/Zimmet_Tutanagi.pdf";
const PdfDrawer = ({ open, setOpen }) => {
  const intl = useIntl();
  const onClose = () => {
    setOpen(false);
  };
  return (
    <Drawer
      title={intl.formatMessage({ id: "zimmetBilgilerim.pdfDrawerTitle" })}
      placement="right"
      onClose={onClose}
      open={open}
      size="large"
    >
      <object
        data={pdfFile}
        style={{ height: "100%", width: "100%" }}
        type="application/pdf"
        title={intl.formatMessage({ id: "zimmetBilgilerim.pdfDrawerTitle" })}
        aria-label={intl.formatMessage({ id: "zimmetBilgilerim.pdfDrawerTitle" })}
      />
    </Drawer>
  );
};
export default PdfDrawer;
