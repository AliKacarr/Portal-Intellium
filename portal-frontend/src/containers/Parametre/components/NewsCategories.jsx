import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Input, message, Space, Popconfirm, Table } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import CustomModal from "./CustomModal/CustomModal";
import {
  AddNewsCategory,
  DeleteNewsCategory,
  GetAllNewsCategories,
  unwrapNewsCategoryList,
  UpdateNewsCategory,
} from "../../../Api/NewsCategoryApi";

const { TextArea } = Input;

function normalizeCategoryRow(row) {
  if (!row) return row;
  return {
    ...row,
    id: row.id ?? row.Id,
    name: row.name ?? row.Name,
    description: row.description ?? row.Description ?? "",
  };
}

export default function NewsCategoriesComponent() {
  const intl = useIntl();
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState({ visible: false, current: null });
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await GetAllNewsCategories();
      setCategories(unwrapNewsCategoryList(response).map(normalizeCategoryRow));
    } catch {
      message.error(intl.formatMessage({ id: "parametre.news.loadError" }));
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
    form.setFieldsValue({
      name: record.name,
      description: record.description || "",
    });
    setModal({ visible: true, current: record });
  };

  const handleDelete = async (id) => {
    try {
      await DeleteNewsCategory(id);
      message.success(intl.formatMessage({ id: "parametre.news.deleteSuccess" }));
      fetchCategories();
    } catch {
      message.error(intl.formatMessage({ id: "parametre.news.deleteError" }));
    }
  };

  const handleSubmit = async (values) => {
    const name = String(values.name || "").trim();
    const description = String(values.description || "").trim() || null;
    try {
      if (modal.current) {
        await UpdateNewsCategory(modal.current.id, name, description);
        message.success(intl.formatMessage({ id: "parametre.news.updateSuccess" }));
      } else {
        await AddNewsCategory(name, description);
        message.success(intl.formatMessage({ id: "parametre.news.addSuccess" }));
      }
      fetchCategories();
      setModal({ visible: false, current: null });
    } catch {
      message.error(intl.formatMessage({ id: "parametre.common.operationError" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: "parametre.news.columnName" }),
        dataIndex: "name",
        key: "name",
      },
      {
        title: intl.formatMessage({ id: "parametre.news.columnDescription" }),
        dataIndex: "description",
        key: "description",
        render: (text) => text || "—",
      },
      {
        title: intl.formatMessage({ id: "parametre.common.actions" }),
        key: "actions",
        align: "center",
        width: 100,
        render: (_, record) => (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm
              title={intl.formatMessage({ id: "parametre.news.deleteConfirm" })}
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
    ],
    [intl]
  );

  return (
    <>
      <Card
        title={intl.formatMessage({ id: "parametre.news.title" })}
        style={{ height: "100%", borderRadius: "8px" }}
        size="small"
        extra={
          <Button
            className="custom-button"
            type="primary"
            icon={<PlusCircleOutlined style={{ fontSize: "15px" }} />}
            onClick={handleAdd}
          >
            {intl.formatMessage({ id: "parametre.news.new" })}
          </Button>
        }
      >
        <Table
          dataSource={categories}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      <CustomModal
        visible={modal.visible}
        title={
          modal.current
            ? intl.formatMessage({ id: "parametre.common.edit" })
            : intl.formatMessage({ id: "parametre.news.modalNew" })
        }
        onCancel={() => setModal({ visible: false, current: null })}
        onSubmit={handleSubmit}
        form={form}
      >
        <Form.Item
          name="name"
          label={intl.formatMessage({ id: "parametre.news.nameLabel" })}
          rules={[{ required: true, message: intl.formatMessage({ id: "parametre.news.nameRequired" }) }]}
        >
          <Input placeholder={intl.formatMessage({ id: "parametre.news.namePlaceholder" })} />
        </Form.Item>
        <Form.Item name="description" label={intl.formatMessage({ id: "parametre.news.descriptionLabel" })}>
          <TextArea rows={3} placeholder={intl.formatMessage({ id: "parametre.news.descriptionPlaceholder" })} />
        </Form.Item>
      </CustomModal>
    </>
  );
}
