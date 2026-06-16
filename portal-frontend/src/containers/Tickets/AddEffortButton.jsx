import React, { useState } from "react";
import {
    Form,
    InputNumber,
    Input,
    Button,
    message,
    Switch,
    Modal
} from "antd";
import { CreateTicketEffort } from "../../Api/TicketEffortApi";
import { useIntl } from "react-intl";



const AddEffortButton = ({ ticketId, setEffortData, setIsModalOpen, isModalOpen }) => {
    const intl = useIntl();

    const [form] = Form.useForm();
    const [apiProgress, setApiProgress] = useState(false);

    const handleSave = async (values) => {
        const { effortMinutes, description, isBillable } = values;

        const formData = {
            ticketId,
            effortMinutes,
            description,
            isBillable,
        };
        setApiProgress(true);
        try {
            const response = await CreateTicketEffort(formData);
            message.success(intl.formatMessage({ id: "tickets.effort.toast.saved" }));
            form.resetFields();
            setIsModalOpen(false);
            setEffortData(prev => [...prev, response.data.data]);
        } catch (error) { }
        setApiProgress(false);
    };



    return (
        <Modal
            title={intl.formatMessage({ id: "tickets.effort.modalTitle" })}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item
                    name="effortMinutes"
                    label={intl.formatMessage({ id: "tickets.effort.modal.minutesLabel" })}
                    rules={[{ required: true }]}
                >
                    <InputNumber min={1} max={480} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                    name="description"
                    label={intl.formatMessage({ id: "tickets.effort.modal.descriptionLabel" })}
                    rules={[{ required: true }]}
                >
                    <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item
                    name="isBillable"
                    label={intl.formatMessage({ id: "tickets.effort.modal.billableLabel" })}
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={apiProgress}>
                    {intl.formatMessage({ id: "tickets.effort.modal.save" })}
                </Button>
            </Form>
        </Modal>
    );
};

export default AddEffortButton;
