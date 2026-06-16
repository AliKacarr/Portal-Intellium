
import React from "react";
import { useIntl } from "react-intl";

//Ant design
import { notification } from "antd";
//==== Ant design ==== 



const Notification = ({ open, close }) => {
  const intl = useIntl();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.success({
      message: intl.formatMessage({ id: "documents.messages.success" }),
      description: intl.formatMessage({ id: "documents.messages.deletedSuccess" }),
      duration: 2,
      placement: "topRight",
    });
  };
  React.useEffect(() => {
    if (open) {
      openNotification();
      setTimeout(() => {
        close(false);
      }, 3000)
    }
  }, [open])
  return (
    <>
      {contextHolder}
    </>
  );
};
export default Notification;

