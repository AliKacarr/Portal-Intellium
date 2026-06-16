import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Input, message, Space, Popconfirm, Table } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import CustomModal from "../../Parametre/components/CustomModal/CustomModal";
import { AddBoardCategories, DeleteBoardCategories, EditBoardCategories, GetBoardCategories } from "../../../Api/ParameterApi";


export default function BoardCategoriesComponent() {
    const intl = useIntl();
    const [categories, setCategories] = useState([]);
    const [modal, setModal] = useState({ visible: false, current: null });
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await GetBoardCategories();
            setCategories(response.data.data);
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.board.loadError" }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
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
            await DeleteBoardCategories(id);
            message.success(intl.formatMessage({ id: "parametre.board.deleteSuccess" }));
            fetchCategories();
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.board.deleteError" }));
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (modal.current) {
                const updatedCategory = { ...modal.current, ...values };
                await EditBoardCategories(updatedCategory);
                message.success(intl.formatMessage({ id: "parametre.board.updateSuccess" }));
            } else {
                await AddBoardCategories(values);
                message.success(intl.formatMessage({ id: "parametre.board.addSuccess" }));
            }
            fetchCategories();
            setModal({ visible: false, current: null });
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.common.operationError" }));
        }
    };

    const columns = useMemo(() => [
        {
            title: intl.formatMessage({ id: "parametre.board.columnName" }),
            dataIndex: "name",
            key: "name",
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
                        title={intl.formatMessage({ id: "parametre.board.deleteConfirm" })}
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
                title={intl.formatMessage({ id: "parametre.board.title" })}
                style={{ height: "100%", borderRadius: "8px" }}
                size="small"
                extra={
                    <Button
                        className="custom-button"
                        type="primary"
                        icon={<PlusCircleOutlined style={{ fontSize: "15px" }} />}
                        onClick={handleAdd}
                    >
                        {intl.formatMessage({ id: "parametre.board.new" })}
                    </Button>
                }
            >
                <Table
                    dataSource={categories}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    loading={loading}
                />
            </Card>

            <CustomModal
                visible={modal.visible}
                title={modal.current ? intl.formatMessage({ id: "parametre.common.edit" }) : intl.formatMessage({ id: "parametre.board.modalNew" })}
                onCancel={() => setModal({ visible: false, current: null })}
                onSubmit={handleSubmit}
                form={form}
            >
                <Form.Item
                    name="name"
                    label={intl.formatMessage({ id: "parametre.board.nameLabel" })}
                    rules={[{ required: true, message: intl.formatMessage({ id: "parametre.board.nameRequired" }) }]}
                >
                    <Input placeholder={intl.formatMessage({ id: "parametre.board.namePlaceholder" })} />
                </Form.Item>
            </CustomModal>
        </>
    );
}
