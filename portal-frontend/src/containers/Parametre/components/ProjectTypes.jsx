import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Input, Table, Popconfirm, message } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { AddProjectType, DeleteProjectType, EditProjectType, GetProjectTypes } from "../../../Api/ParameterApi";
import CustomModal from "./CustomModal/CustomModal";


export default function ProjectTypesComponent() {
    const intl = useIntl();
    const [projectTypes, setProjectTypes] = useState([]);
    const [modal, setModal] = useState({ visible: false, current: null });
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const fetchProjectTypes = async () => {
        setLoading(true);
        try {
            const response = await GetProjectTypes();
            setProjectTypes(response.data.data);
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.project.loadError" }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectTypes();
    }, []);

    const handleAdd = () => {
        form.resetFields();
        setModal({ visible: true, current: null });
    };

    const handleEdit = (record) => {
        form.setFieldsValue(record);
        setModal({ visible: true, current: record });
    };

    const handleDelete = async (id) => {
        try {
            await DeleteProjectType(id);
            message.success(intl.formatMessage({ id: "parametre.project.deleteSuccess" }));
            fetchProjectTypes();
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.project.deleteError" }));
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                id: modal.current?.id || 0,
                projectTypeName: values.projectTypeName,
            };

            if (modal.current) {
                await EditProjectType(payload);
                message.success(intl.formatMessage({ id: "parametre.project.updateSuccess" }));
            } else {
                await AddProjectType(payload);
                message.success(intl.formatMessage({ id: "parametre.project.addSuccess" }));
            }
            fetchProjectTypes();
            setModal({ visible: false, current: null });
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.common.operationError" }));
        }
    };

    const columns = useMemo(() => [
        {
            title: intl.formatMessage({ id: "parametre.project.columnName" }),
            dataIndex: "projectTypeName",
            key: "projectTypeName",
        },
        {
            title: intl.formatMessage({ id: "parametre.common.actions" }),
            key: "actions",
            width: 100,
            align: "center",
            render: (_, record) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    ></Button>
                    <Popconfirm
                        title={intl.formatMessage({ id: "parametre.project.deleteConfirm" })}
                        okText={intl.formatMessage({ id: "parametre.common.yes" })}
                        cancelText={intl.formatMessage({ id: "parametre.common.no" })}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button danger type="text" className="projectDltBtn" title="">
                            <i className="ion-android-delete" />
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ], [intl]);

    return (
        <Card
            title={intl.formatMessage({ id: "parametre.project.title" })}
            style={{ height: "100%", borderRadius: "8px" }}
            size="small"
            extra={
                <Button
                    className="custom-button"
                    type="primary"
                    icon={<PlusCircleOutlined style={{ fontSize: "15px" }} />}
                    onClick={handleAdd}
                >
                    {intl.formatMessage({ id: "parametre.project.new" })}
                </Button>
            }
        >
            <Table
                dataSource={projectTypes}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                loading={loading}
            />

            <CustomModal
                visible={modal.visible}
                title={modal.current ? intl.formatMessage({ id: "parametre.common.edit" }) : intl.formatMessage({ id: "parametre.project.modalNew" })}
                onCancel={() => setModal({ visible: false, current: null })}
                onSubmit={handleSubmit}
                form={form}
            >
                <Form.Item
                    name="projectTypeName"
                    label={intl.formatMessage({ id: "parametre.project.nameLabel" })}
                    rules={[{ required: true, message: intl.formatMessage({ id: "parametre.project.nameRequired" }) }]}
                >
                    <Input placeholder={intl.formatMessage({ id: "parametre.project.namePlaceholder" })} />
                </Form.Item>
            </CustomModal>

        </Card>
    );
}
