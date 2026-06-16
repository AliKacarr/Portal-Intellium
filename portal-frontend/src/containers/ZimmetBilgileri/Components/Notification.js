
import React from "react";
import { useIntl } from "react-intl";

//Ant design
import { notification } from "antd";
//==== Ant design ==== 



const Notification = ({ open,close }) => {
  const intl = useIntl();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = () => {
    api.success({
      message: intl.formatMessage({ id: "zimmetBilgileri.notification.successTitle" }),
      description: intl.formatMessage({ id: "zimmetBilgileri.notification.deleteDesc" }),
      duration: 2,
      placement: "topRight",
    });
  };
  React.useEffect(()=>{
    if(open){
        openNotification();
        setTimeout(() => {
            close(false);
        },3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when `open` / locale changes
  },[open, intl])
  return (
    <>
      {contextHolder}
    </>
  );
};
export default Notification;
