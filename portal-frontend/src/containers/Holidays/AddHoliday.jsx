import { Button, DatePicker, Form, Input, message, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { CreateHoliday, UpdateHoliday } from "../../Api/HolidayApi";
import moment from "moment";
import { useIntl } from "react-intl";
const { RangePicker } = DatePicker;

const AddHoliday = ({
    refreshlist,
    isModalOpen,
    setIsModalOpen,
    initialValues,
    isEditMode,
}) => {
    const intl = useIntl();
    const [messageApi, contextHolder] = message.useMessage();
    const [apiProgress, setApiProgress] = useState(false);
    const [form] = Form.useForm();

    // Modal açıldığında veya initialValues değiştiğinde formu doldur/temizle
    useEffect(() => {
        if (isModalOpen) {
            if (isEditMode && initialValues) {
                // Düzenleme modunda verileri form alanlarına yerleştir
                form.setFieldsValue({
                    holidayName: initialValues.name,
                    time: [
                        moment(initialValues.startTime),
                        moment(initialValues.endTime),
                    ],
                });
            } else {
                // Ekleme modunda formu sıfırla
                form.resetFields();
            }
        }
    }, [isModalOpen, initialValues, isEditMode, form]);

    ////////on finish
    const onFinish = async (values) => {
        const formData = {
            // Edit modunda id zorunludur
            ...(isEditMode && { id: initialValues.id }),
            year: values.time[1].year(),
            name: values.holidayName,
            startTime: values.time[0].toDate(),
            endTime: values.time[1].toDate(),
        };

        setApiProgress(true);
        try {
            // İşlemi belirle: Güncelleme mi, Ekleme mi?
            const apiCall = isEditMode ? UpdateHoliday : CreateHoliday;
            await apiCall(formData);

            messageApi.open({
                type: "success",
                content: isEditMode
                    ? intl.formatMessage({ id: "holidays.messages.updated" })
                    : intl.formatMessage({ id: "holidays.messages.created" }),
            });
            refreshlist();
            setIsModalOpen(false); // İşlem başarılıysa modalı kapat
        } catch (e) {
            messageApi.open({
                type: "error",
                content: isEditMode
                    ? intl.formatMessage({ id: "holidays.messages.updateFailed" })
                    : intl.formatMessage({ id: "holidays.messages.createFailed" }),
            });
        }
        setApiProgress(false);
    };

    const tailLayout = {
        wrapperCol: {
            offset: 8,
            span: 16,
        },
    };

    return (
        <>
            {contextHolder}
            {/* Buton buradan kaldırıldı, artık Holidays.js'de */}
            
            <Modal
                width={550}
                title={isEditMode ? intl.formatMessage({ id: "holidays.modal.editTitle" }) : intl.formatMessage({ id: "holidays.modal.createTitle" })}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose={true} // Modal kapandığında formu tamamen sıfırlar
            >
                <Form
                    form={form}
                    labelCol={{
                        span: 8,
                    }}
                    wrapperCol={{
                        span: 16,
                    }}
                    style={{
                        maxWidth: 500,
                    }}
                    layout="horizontal"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="holidayName"
                        label={intl.formatMessage({ id: "holidays.form.holidayName" })}
                        rules={[
                            {
                                required: true,
                                message: intl.formatMessage({ id: "holidays.form.holidayNameRequired" }),
                            },
                        ]}
                    >
                        <Input placeholder={intl.formatMessage({ id: "holidays.form.holidayName" })} />
                    </Form.Item>

                    <Form.Item
                        name="time"
                        label={intl.formatMessage({ id: "holidays.form.dateRange" })}
                        style={{ width: "100%" }}
                        rules={[
                            {
                                required: true,
                                message: intl.formatMessage({ id: "holidays.form.dateRangeRequired" }),
                                type: "array",
                            },
                        ]}
                    >
                        <RangePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
                    </Form.Item>
                    <Form.Item {...tailLayout} style={{ marginBottom: 0 }}>
                        <Button
                            style={{ float: "right" }}
                            type="primary"
                            htmlType="submit"
                            loading={apiProgress}
                        >
                            {isEditMode ? intl.formatMessage({ id: "holidays.actions.update" }) : intl.formatMessage({ id: "holidays.actions.create" })}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AddHoliday;