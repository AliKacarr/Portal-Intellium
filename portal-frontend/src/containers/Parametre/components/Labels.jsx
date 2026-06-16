import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Input, Popconfirm, message, Space, Table, Row, Col } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import CustomModal from "../../Parametre/components/CustomModal/CustomModal";
import {
    AddLabel,
    DeleteLabel,
    EditLabel,
    GetLabels,
} from "../../../Api/ParameterApi";
import "../ParameterManagement.css";


export default function LabelsComponent() {
    const intl = useIntl();
    const [labels, setLabels] = useState([]);
    const [modal, setModal] = useState({ visible: false, current: null });
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const fetchLabels = async () => {
        setLoading(true);
        try {
            const response = await GetLabels();
            setLabels(response.data.data);
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.labels.loadError" }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);


    const handleAdd = () => {
        form.resetFields();
        form.setFieldsValue({ color: "#000000" });
        setModal({ visible: true, current: null });
    };

    const handleEdit = (record) => {
        form.setFieldsValue({
            ...record,
            color: `#${record.color}`,
        });
        setModal({ visible: true, current: record });
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                color: values.color.replace("#", ""),
            };

            if (modal.current) {
                const updatedLabel = { ...modal.current, ...payload };
                await EditLabel(updatedLabel);
                message.success(intl.formatMessage({ id: "parametre.labels.updateSuccess" }));
            } else {
                await AddLabel(payload);
                message.success(intl.formatMessage({ id: "parametre.labels.addSuccess" }));
            }
            fetchLabels();
            setModal({ visible: false, current: null });
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.common.operationError" }));
        }
    };

    const handleDelete = async (id) => {
        try {
            await DeleteLabel(id);
            fetchLabels();
            message.success(intl.formatMessage({ id: "parametre.labels.deleteSuccess" }));
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.labels.deleteError" }));
        }
    };

    const columns = useMemo(() => [
        {
            title: intl.formatMessage({ id: "parametre.labels.columnName" }),
            dataIndex: "name",
            key: "name",
        },
        {
            title: intl.formatMessage({ id: "parametre.labels.columnColor" }),
            dataIndex: "color",
            key: "color",
            width: 100,
            align: "center",
            render: (color) => (
                <div
                    style={{
                        width: "24px",
                        height: "24px",
                        backgroundColor: `#${color}`,
                        borderRadius: "50%",
                        display: "inline-block",
                        border: "1px solid #ddd",
                    }}
                />
            ),
        },
        {
            title: intl.formatMessage({ id: "parametre.common.actions" }),
            key: "actions",
            align: "center",
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    ></Button>
                    <Popconfirm
                        title={intl.formatMessage({ id: "parametre.labels.deleteConfirm" })}
                        okText={intl.formatMessage({ id: "parametre.common.yes" })}
                        cancelText={intl.formatMessage({ id: "parametre.common.no" })}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button danger type="text" className="projectDltBtn" title="">
                            <i className="ion-android-delete" />
                        </Button>

                    </Popconfirm>
                </Space>
            ),
        },
    ], [intl]);

    return (
        <>
            <Card
                title={intl.formatMessage({ id: "parametre.labels.title" })}
                style={{ height: "100%", borderRadius: "8px" }}
                size="small"
                extra={
                    <Button
                        className="custom-button"
                        type="primary"
                        icon={<PlusCircleOutlined style={{ fontSize: "15px" }} />}
                        onClick={handleAdd}
                    >
                        {intl.formatMessage({ id: "parametre.labels.new" })}
                    </Button>
                }
            >
                <Table
                    dataSource={labels}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    loading={loading}
                />
            </Card>

            <CustomModal
                visible={modal.visible}
                title={modal.current ? intl.formatMessage({ id: "parametre.common.edit" }) : intl.formatMessage({ id: "parametre.labels.modalNew" })}
                onCancel={() => {
                    setModal({ visible: false, current: null });
                    form.resetFields();
                }}
                onSubmit={handleSubmit}
                form={form}
            >
                <Row gutter={8} justify={"center"}>
                    <Col xs={24} sm={4} className="centered-column" >
                        <Form.Item
                            name="color"
                            label={intl.formatMessage({ id: "parametre.labels.colorLabel" })}
                            rules={[{ required: true, message: intl.formatMessage({ id: "parametre.labels.colorRequired" }) }]}
                            valuePropName="value"
                            getValueFromEvent={(e) => e.target.value}
                        >
                            <Input
                                type="color"
                                className="custom-color-input"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={20} className="centered-column">
                        <Form.Item
                            name="name"
                            label={intl.formatMessage({ id: "parametre.labels.nameLabel" })}
                            rules={[{ required: true, message: intl.formatMessage({ id: "parametre.labels.nameRequired" }) }]}
                        >
                            <Input placeholder={intl.formatMessage({ id: "parametre.labels.namePlaceholder" })} />
                        </Form.Item>
                    </Col>
                </Row>
            </CustomModal>

        </>
    );
}
