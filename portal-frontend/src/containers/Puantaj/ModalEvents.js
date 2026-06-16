import React, { useMemo } from "react";
import moment from "moment";
import Input from "@iso/components/uielements/input";
import { DateRangepicker } from "@iso/components/uielements/datePicker";
import Modal from "@iso/components/Feedback/Modal";
import { CalendarModalBody } from "./Calendar.styles";
import { useIntl } from "react-intl";
import datePickerLocaleTr from "antd/es/date-picker/locale/tr_TR";
import datePickerLocaleEn from "antd/es/date-picker/locale/en_US";

import DeleteButton from "./DeleteButton";
const RangePicker = DateRangepicker;

export default function ModalEvents({ modalVisible, selectedData, setModalData }) {
  const intl = useIntl();

  const rangePickerLocale = useMemo(() => {
    return intl.locale === "tr-TR" ? datePickerLocaleTr : datePickerLocaleEn;
  }, [intl.locale]);

  const ranges = useMemo(
    () => ({
      [intl.formatMessage({ id: "puantaj.range.today" })]: [moment(), moment()],
      [intl.formatMessage({ id: "puantaj.range.thisMonth" })]: [
        moment(),
        moment().endOf("month"),
      ],
    }),
    [intl]
  );

  const handleOk = () => {
    setModalData("ok", selectedData);
  };
  const handleCancel = () => {
    setModalData("cancel");
  };

  const handleDelete = () => {
    setModalData("delete", selectedData);
  };
  const visible = modalVisible ? true : false;
  if (!visible) return null;

  const title = selectedData && selectedData.title ? selectedData.title : "";
  const desc = selectedData && selectedData.desc ? selectedData.desc : "";
  const start =
    selectedData && selectedData.start ? moment(selectedData.start) : "";
  const end =
    selectedData && selectedData.end ? moment(selectedData.end) : "";
  const onChangeTitle = (event) => {
    selectedData.title = event.target.value;
    setModalData("updateValue", selectedData);
  };
  const onChangeDesc = (event) => {
    selectedData.desc = event.target.value;
    setModalData("updateValue", selectedData);
  };
  const onChangeFromTimePicker = (value) => {
    try {
      selectedData.start = value[0].toDate();
      selectedData.end = value[1].toDate();
    } catch (e) {}
    setModalData("updateValue", selectedData);
  };
  return (
    <div>
      <Modal
        title={
          modalVisible === "update"
            ? intl.formatMessage({ id: "puantaj.modalEvents.titleUpdate" })
            : intl.formatMessage({ id: "puantaj.modalEvents.titleSet" })
        }
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={intl.formatMessage({ id: "puantaj.modalEvents.ok" })}
        cancelText={intl.formatMessage({ id: "puantaj.modalEvents.cancel" })}
      >
        <CalendarModalBody>
          <div className="isoCalendarInputWrapper">
            <Input
              value={title}
              placeholder={intl.formatMessage({ id: "puantaj.modalEvents.titlePh" })}
              onChange={onChangeTitle}
            />
          </div>

          <div className="isoCalendarInputWrapper">
            <Input
              value={desc}
              placeholder={intl.formatMessage({ id: "puantaj.modalEvents.descPh" })}
              onChange={onChangeDesc}
            />
          </div>

          <div className="isoCalendarDatePicker">
            <RangePicker
              locale={rangePickerLocale}
              ranges={ranges}
              value={[start, end]}
              showTime
              format="YYYY/MM/DD HH:mm:ss"
              onChange={onChangeFromTimePicker}
            />
            <DeleteButton handleDelete={handleDelete} />
          </div>
        </CalendarModalBody>
      </Modal>
    </div>
  );
}
