import React, { useState } from "react";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import moment from "moment";
import { useIntl } from "react-intl";

import {
  Calendar,
  Modal,
  DatePicker,
  Breadcrumb,
  Input,
  Button,
  Badge,
} from "antd";

function Puantaj() {
  const intl = useIntl();
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [events, setEvents] = useState([
    {
      date: "2024-01-30",
      text: "deneme",
    },
    {
      date: "2024-01-30",
      text: "deneme2",
    },
    {
      date: "2024-01-01",
      text: "deneme2",
    },
    {
      date: "2024-01-06",
      text: "deneme2",
    },
    {
      date: "2024-01-13",
      text: "deneme2",
    },
  ]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setSelectedDate(null);
    setTextValue("");
    setModalVisible(false);
  };

  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  };

  const handleSave = () => {
    console.log("Selected Date:", selectedDate.format("YYYY-MM-DD"));
    console.log("Text Value:", textValue);

    const newEvent = {
      date: selectedDate.format("YYYY-MM-DD"),
      text: textValue,
    };
    setEvents([...events, newEvent]);

    handleModalClose();
  };

  const getEventsByDate = (date) => {
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const eventsOnDate = events.filter((event) => event.date === formattedDate);
    return eventsOnDate;
  };

  const dateCellRender = (value) => {
    const eventsOnDate = getEventsByDate(value);
    return eventsOnDate.length ? (
      <ul className="events">
        {eventsOnDate.map((item, index) => (
          <li key={index}>
            <Badge status="success" text={item.text} />
          </li>
        ))}
      </ul>
    ) : null;
  };

  return (
    <LayoutWrapper>
      <Box>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            {intl.formatMessage({ id: "puantaj.breadcrumb.home" })}
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {intl.formatMessage({ id: "puantaj.breadcrumb.self" })}
          </Breadcrumb.Item>
        </Breadcrumb>

        <Calendar
          onSelect={handleDateClick}
          value={selectedDate ? moment(selectedDate) : null}
          dateCellRender={dateCellRender}
          mode="month"
          headerRender={() => null}
        />

        <Modal
          title={intl.formatMessage({ id: "puantaj.modal.title" })}
          open={modalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="cancel" onClick={handleModalClose}>
              {intl.formatMessage({ id: "puantaj.modal.cancel" })}
            </Button>,
            <Button key="save" type="primary" onClick={handleSave}>
              {intl.formatMessage({ id: "puantaj.modal.save" })}
            </Button>,
          ]}
        >
          <div>
            <p>{intl.formatMessage({ id: "puantaj.modal.selectedDate" })}</p>
            <DatePicker
              value={selectedDate ? moment(selectedDate) : null}
              onChange={(date) => setSelectedDate(date)}
            />
          </div>
          <div style={{ marginTop: "16px" }}>
            <p>{intl.formatMessage({ id: "puantaj.modal.effort" })}</p>
            <Input value={textValue} onChange={handleTextChange} />
          </div>
        </Modal>
      </Box>
    </LayoutWrapper>
  );
}

export default Puantaj;
