import React, { useState } from "react";
import { Button, message, Popconfirm } from "antd";
import { MarkAsResolved } from "../../Api/TicketApi";

const MarkAsResolveButton = ({ ticketId, refreshDetail }) => {
  const [apiProgress, setApiProgress] = useState(false);

  const resolveTicket = async () => {
    setApiProgress(true);
    try {
      const response = await MarkAsResolved(ticketId);
      if (response.data.success) {
        message.success(response.data.message);
        refreshDetail(true);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error("Bilet kapatma işlemi sırasında bir hata meydana geldi.");
    }
    setApiProgress(false);
  };

  return (
    <div>
      <Popconfirm
        title="Bileti kapatmak istediğinizden emin misiniz?"
        onConfirm={resolveTicket}
        okText="Evet"
        cancelText="Hayır"
        placement="left"
      >
        <Button danger loading={apiProgress}>
          Bileti kapat
        </Button>
      </Popconfirm>
    </div>
  );
};

export default MarkAsResolveButton;
