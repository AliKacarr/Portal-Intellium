import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Input, Table, Popconfirm, message, Select, InputNumber, Switch, Tag, Typography, Divider, Space } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { AddPermissionType, DeletePermissionType, EditPermissionType, GetPermissionTypes } from "../../../Api/ParameterApi";
import CustomModal from "./CustomModal/CustomModal";

const { Option } = Select;
const { TextArea } = Input;

export default function PermissionTypesComponent() {
    const intl = useIntl();
    const durationUnitLabel = (u) =>
        u === 2
            ? intl.formatMessage({ id: "parametre.permission.durationUnit.hour" })
            : intl.formatMessage({ id: "parametre.permission.durationUnit.day" });

    const [permissionTypes, setPermissionTypes] = useState([]);
    const [modal, setModal] = useState({ visible: false, current: null });
    const [form] = Form.useForm();
    const durationUnitWatched = Form.useWatch("durationUnit", form);
    const isDayUnit = (durationUnitWatched ?? 1) === 1;
    const [loading, setLoading] = useState(false);

    const fetchPermissionTypes = async () => {
        setLoading(true);
        try {
            const response = await GetPermissionTypes();
            const data = response.data.data !== undefined ? response.data.data : response.data;
            const filteredData = data.filter((item) => {
                const p = (item.permission || item.Permission || "").toLowerCase();
                return p === "mazeret";
            });
            setPermissionTypes(filteredData);
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.permission.loadError" }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissionTypes();
    }, []);

    const handleAdd = () => {
        form.resetFields();
        form.setFieldsValue({ durationUnit: 1, minDuration: 1, isDivisible: false, requiresDocument: false, isPriority: false, isDeleteable: true });
        setModal({ visible: true, current: null });
    };

    const handleEdit = (record) => {
        const durationUnit = record.durationUnit ?? record.DurationUnit ?? 1;
        const maxDuration = record.maxDuration ?? record.MaxDuration;
        const minDuration = record.minDuration ?? record.MinDuration;
        form.setFieldsValue({
            ...record,
            durationUnit,
            maxDuration: maxDuration != null ? Number(maxDuration) : undefined,
            minDuration: minDuration != null ? Number(minDuration) : undefined,
        });
        setModal({ visible: true, current: record });
    };

    const handleDelete = async (id) => {
        try {
            await DeletePermissionType(id);
            message.success(intl.formatMessage({ id: "parametre.permission.deleteSuccess" }));
            fetchPermissionTypes();
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.permission.deleteError" }));
        }
    };

    const handleSubmit = async (values) => {
        try {
            const du = Number(values.durationUnit);
            let maxDuration = values.maxDuration != null && values.maxDuration !== "" ? Number(values.maxDuration) : null;
            let minDuration = values.minDuration != null && values.minDuration !== "" ? Number(values.minDuration) : null;
            if (du === 1) {
                if (maxDuration != null) maxDuration = Math.round(maxDuration);
                if (minDuration != null) minDuration = Math.round(minDuration);
            }
            const payload = {
                id: modal.current?.id || 0,
                ...values,
                permission: "Mazeret",
                durationUnit: du,
                maxDuration,
                minDuration,
            };

            if (modal.current) {
                await EditPermissionType(payload);
                message.success(intl.formatMessage({ id: "parametre.permission.updateSuccess" }));
            } else {
                await AddPermissionType(payload);
                message.success(intl.formatMessage({ id: "parametre.permission.addSuccess" }));
            }
            fetchPermissionTypes();
            setModal({ visible: false, current: null });
        } catch (error) {
            message.error(intl.formatMessage({ id: "parametre.common.operationError" }));
        }
    };

    const paidStatusTag = (status) => {
        let color = "default";
        if (status === "Ücretli") color = "success";
        if (status === "Ücretsiz") color = "error";
        if (status === "SGK") color = "processing";
        const label =
            status === "Ücretli"
                ? intl.formatMessage({ id: "parametre.permission.paidOptionPaid" })
                : status === "Ücretsiz"
                  ? intl.formatMessage({ id: "parametre.permission.paidOptionUnpaid" })
                  : status === "SGK"
                    ? intl.formatMessage({ id: "parametre.permission.paidOptionSgk" })
                    : status;
        return <Tag color={color}>{label}</Tag>;
    };

    const yesNoTag = (val, yesColor = "success") =>
        val ? (
            <Tag color={yesColor}>{intl.formatMessage({ id: "parametre.common.yes" })}</Tag>
        ) : (
            <Tag color="default">{intl.formatMessage({ id: "parametre.common.no" })}</Tag>
        );

    const columns = useMemo(() => [
        {
            title: intl.formatMessage({ id: "parametre.permission.columnExcuseType" }),
            dataIndex: "subPermission",
            key: "subPermission",
            render: (text) => <Typography.Text strong>{text}</Typography.Text>,
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnUnit" }),
            key: "durationUnit",
            align: "center",
            render: (_, r) => {
                const u = r.durationUnit ?? r.DurationUnit ?? 1;
                return <Tag color={u === 2 ? "purple" : "blue"}>{durationUnitLabel(u)}</Tag>;
            },
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnMinMax" }),
            key: "minmax",
            align: "center",
            render: (_, r) => {
                const minV = r.minDuration ?? r.MinDuration;
                const maxV = r.maxDuration ?? r.MaxDuration;
                const u = r.durationUnit ?? r.DurationUnit ?? 1;
                const unit = u === 2
                    ? intl.formatMessage({ id: "parametre.permission.unitHourSuffix" })
                    : intl.formatMessage({ id: "parametre.permission.unitDaySuffix" });
                const dash = intl.formatMessage({ id: "parametre.permission.minMaxDash" });
                const inf = intl.formatMessage({ id: "parametre.permission.minMaxInfinity" });
                const minStr = minV != null ? `${minV}${unit}` : dash;
                const maxStr = maxV != null ? `${maxV}${unit}` : inf;
                return <Typography.Text type="secondary">{minStr} / {maxStr}</Typography.Text>;
            },
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnPaidStatus" }),
            dataIndex: "isPaid",
            key: "isPaid",
            render: (status) => paidStatusTag(status),
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnLegalBasis" }),
            dataIndex: "legalBasis",
            key: "legalBasis",
            render: (text) => <Typography.Text type="secondary">{text}</Typography.Text>,
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnDivisible" }),
            dataIndex: "isDivisible",
            key: "isDivisible",
            render: (val) => yesNoTag(val, "success"),
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnDocRequired" }),
            dataIndex: "requiresDocument",
            key: "requiresDocument",
            render: (val) => yesNoTag(val, "warning"),
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnPriority" }),
            dataIndex: "isPriority",
            key: "isPriority",
            render: (val) => yesNoTag(val, "geekblue"),
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnDeletable" }),
            dataIndex: "isDeleteable",
            key: "isDeleteable",
            render: (val) =>
                val !== false ? (
                    <Tag color="green">{intl.formatMessage({ id: "parametre.common.yes" })}</Tag>
                ) : (
                    <Tag color="error">{intl.formatMessage({ id: "parametre.common.no" })}</Tag>
                ),
        },
        {
            title: intl.formatMessage({ id: "parametre.permission.columnDescription" }),
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: intl.formatMessage({ id: "parametre.common.actions" }),
            key: "actions",
            width: 100,
            align: "center",
            render: (_, record) => {
                const canDelete = record.isDeleteable !== false && record.IsDeleteable !== false;
                return (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        ></Button>
                        {canDelete && (
                            <Popconfirm
                                title={intl.formatMessage({ id: "parametre.permission.deleteConfirm" })}
                                okText={intl.formatMessage({ id: "parametre.common.yes" })}
                                cancelText={intl.formatMessage({ id: "parametre.common.no" })}
                                onConfirm={() => handleDelete(record.id)}
                            >
                                <Button danger type="text" className="projectDltBtn" title="">
                                    <i className="ion-android-delete" />
                                </Button>
                            </Popconfirm>
                        )}
                    </div>
                );
            },
        },
    ], [intl]);

    return (
        <Card
            title={<Typography.Title level={5} style={{ margin: 0, color: "#1890ff" }}>{intl.formatMessage({ id: "parametre.permission.cardTitle" })}</Typography.Title>}
            style={{ height: "100%", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "none" }}
            size="small"
            extra={
                <Button
                    className="custom-button"
                    type="primary"
                    onClick={handleAdd}
style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(90deg, #1890ff, #52c41a)",
                        border: "none",
                        boxShadow: "0 2px 6px rgba(24,144,255,0.3)"
                    }}
                >
                    <Space
                        size={8}
                        align="center"
                        style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}
                    >
                        <PlusCircleOutlined style={{ fontSize: 16, lineHeight: 1, display: "flex" }} />
                        <span style={{ lineHeight: 1.2 }}>{intl.formatMessage({ id: "parametre.permission.addButton" })}</span>
                    </Space>
                </Button>
            }
        >
            <Table
                dataSource={permissionTypes}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                loading={loading}
                scroll={{ x: 1000 }}
            />

            <CustomModal
                visible={modal.visible}
                title={
                    <div style={{ paddingBottom: "10px", borderBottom: "1px solid #f0f0f0", marginBottom: "20px" }}>
                        <Typography.Title level={4} style={{ margin: 0, color: "#262626" }}>
                            {modal.current
                                ? intl.formatMessage({ id: "parametre.permission.modalEditTitle" })
                                : intl.formatMessage({ id: "parametre.permission.modalCreateTitle" })}
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            {intl.formatMessage({ id: "parametre.permission.modalSubtitle" })}
                        </Typography.Text>
                    </div>
                }
                onCancel={() => setModal({ visible: false, current: null })}
                onSubmit={handleSubmit}
                form={form}
                width={720}
                bodyStyle={{ paddingTop: 0 }}
            >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                    <Form.Item
                        name="subPermission"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldExcuseName" })}</Typography.Text>}
                        rules={[{ required: true, message: intl.formatMessage({ id: "parametre.permission.fieldExcuseNameRequired" }) }]}
                    >
                        <Input size="large" placeholder={intl.formatMessage({ id: "parametre.permission.fieldExcusePlaceholder" })} style={{ borderRadius: "6px" }} />
                    </Form.Item>

                    <Form.Item
                        name="durationUnit"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldDurationUnit" })}</Typography.Text>}
                        rules={[{ required: true }]}
                        initialValue={1}
                    >
                        <Select
                            size="large"
                            onChange={() => {
                                form.setFieldsValue({ minDuration: undefined, maxDuration: undefined });
                            }}
                        >
                            <Option value={1}>{intl.formatMessage({ id: "parametre.permission.durationUnit.day" })}</Option>
                            <Option value={2}>{intl.formatMessage({ id: "parametre.permission.durationUnit.hour" })}</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="minDuration"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldMinDuration" })}</Typography.Text>}
                        tooltip={
                            isDayUnit
                                ? intl.formatMessage({ id: "parametre.permission.tooltipMinDay" })
                                : intl.formatMessage({ id: "parametre.permission.tooltipMinHour" })
                        }
                        dependencies={["maxDuration"]}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (value == null || value === "") return Promise.resolve();
                                    const max = getFieldValue("maxDuration");
                                    if (max != null && max !== "" && Number(value) >= Number(max)) {
                                        return Promise.reject(
                                            new Error(intl.formatMessage({ id: "parametre.permission.validationMinLessThanMax" }))
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <InputNumber
                            size="large"
                            min={0}
                            step={isDayUnit ? 1 : 0.5}
                            precision={isDayUnit ? 0 : 1}
                            style={{ width: "100%" }}
                            placeholder={intl.formatMessage({ id: "parametre.permission.placeholderOptional" })}
                        />
                    </Form.Item>

                    <Form.Item
                        name="maxDuration"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldMaxDuration" })}</Typography.Text>}
                        tooltip={
                            isDayUnit
                                ? intl.formatMessage({ id: "parametre.permission.tooltipMaxDay" })
                                : intl.formatMessage({ id: "parametre.permission.tooltipMaxHour" })
                        }
                        dependencies={["minDuration"]}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (value == null || value === "") return Promise.resolve();
                                    const min = getFieldValue("minDuration");
                                    if (min != null && min !== "" && Number(value) <= Number(min)) {
                                        return Promise.reject(
                                            new Error(intl.formatMessage({ id: "parametre.permission.validationMaxGreaterThanMin" }))
                                        );
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <InputNumber
                            size="large"
                            min={0}
                            step={isDayUnit ? 1 : 0.5}
                            precision={isDayUnit ? 0 : 1}
                            style={{ width: "100%" }}
                            placeholder={intl.formatMessage({ id: "parametre.permission.placeholderOptionalUnlimited" })}
                        />
                    </Form.Item>

                    <Divider style={{ gridColumn: "span 2", margin: "12px 0" }} />

                    <Form.Item
                        name="isPaid"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldPaidStatus" })}</Typography.Text>}
                        rules={[{ required: true, message: intl.formatMessage({ id: "parametre.permission.fieldPaidRequired" }) }]}
                    >
                        <Select size="large" placeholder={intl.formatMessage({ id: "parametre.permission.paidSelectPlaceholder" })}>
                            <Option value="Ücretli">{intl.formatMessage({ id: "parametre.permission.paidOptionPaid" })}</Option>
                            <Option value="Ücretsiz">{intl.formatMessage({ id: "parametre.permission.paidOptionUnpaid" })}</Option>
                            <Option value="SGK">{intl.formatMessage({ id: "parametre.permission.paidOptionSgk" })}</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="legalBasis"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldLegalBasis" })}</Typography.Text>}
                        rules={[{ required: true, message: intl.formatMessage({ id: "parametre.permission.fieldLegalBasisRequired" }) }]}
                    >
                        <Select size="large" placeholder={intl.formatMessage({ id: "parametre.permission.legalBasisPlaceholder" })}>
                            <Option value="4857 İş Kanunu">{intl.formatMessage({ id: "parametre.permission.legalOption4857" })}</Option>
                            <Option value="SGK Mevzuatı">{intl.formatMessage({ id: "parametre.permission.legalOptionSgk" })}</Option>
                            <Option value="Şirket Politikası">{intl.formatMessage({ id: "parametre.permission.legalOptionCompany" })}</Option>
                        </Select>
                    </Form.Item>

                    <Divider style={{ gridColumn: "span 2", margin: "12px 0" }} />

                    <div style={{ display: "flex", gap: "24px", gridColumn: "span 2", padding: "16px", background: "#fafafa", borderRadius: "8px", border: "1px solid #f0f0f0", flexWrap: "wrap" }}>
                        <Form.Item
                            name="isDivisible"
                            label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldDivisible" })}</Typography.Text>}
                            valuePropName="checked"
                            initialValue={false}
                            style={{ margin: 0, flex: "1 1 40%" }}
                        >
                            <Switch checkedChildren={intl.formatMessage({ id: "parametre.common.yes" })} unCheckedChildren={intl.formatMessage({ id: "parametre.common.no" })} />
                        </Form.Item>

                        <Form.Item
                            name="requiresDocument"
                            label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldDocRequired" })}</Typography.Text>}
                            valuePropName="checked"
                            initialValue={false}
                            style={{ margin: 0, flex: "1 1 40%" }}
                        >
                            <Switch checkedChildren={intl.formatMessage({ id: "parametre.common.yes" })} unCheckedChildren={intl.formatMessage({ id: "parametre.common.no" })} />
                        </Form.Item>

                        <Form.Item
                            name="isPriority"
                            label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldPriority" })}</Typography.Text>}
                            valuePropName="checked"
                            initialValue={false}
                            style={{ margin: 0, flex: "1 1 40%" }}
                        >
                            <Switch checkedChildren={intl.formatMessage({ id: "parametre.common.yes" })} unCheckedChildren={intl.formatMessage({ id: "parametre.common.no" })} />
                        </Form.Item>

                        <Form.Item
                            name="isDeleteable"
                            label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldDeletable" })}</Typography.Text>}
                            valuePropName="checked"
                            initialValue={true}
                            style={{ margin: 0, flex: "1 1 40%" }}
                        >
                            <Switch checkedChildren={intl.formatMessage({ id: "parametre.common.yes" })} unCheckedChildren={intl.formatMessage({ id: "parametre.common.no" })} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="description"
                        label={<Typography.Text strong>{intl.formatMessage({ id: "parametre.permission.fieldDescription" })}</Typography.Text>}
                        style={{ gridColumn: "span 2", marginTop: "24px" }}
                    >
                        <TextArea rows={4} placeholder={intl.formatMessage({ id: "parametre.permission.descriptionPlaceholder" })} style={{ borderRadius: "6px" }} />
                    </Form.Item>
                </div>
            </CustomModal>
        </Card>
    );
}
