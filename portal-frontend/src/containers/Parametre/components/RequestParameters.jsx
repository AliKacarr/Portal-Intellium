import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from "antd";
import { EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import {
  addRequestCategory,
  addRequestSubCategory,
  addRequestSubCategoryField,
  deleteRequestCategory,
  deleteRequestSubCategory,
  deleteRequestSubCategoryField,
  getRequestCategories,
  updateRequestCategory,
  updateRequestSubCategory,
  updateRequestSubCategoryField,
} from "../../../Api/RequestApi";
import "./RequestParameters.css";

const unwrapList = (res) => {
  const d = res?.data ?? res?.Data ?? res;
  const inner = d?.data ?? d?.Data ?? d;
  return Array.isArray(inner) ? inner : Array.isArray(d) ? d : [];
};

const rowId = (row) => row?.id ?? row?.Id;
const rowName = (row) => row?.name ?? row?.Name;
const rowSort = (row) => row?.sortOrder ?? row?.SortOrder ?? 0;
const rowSubs = (row) => row?.subCategories ?? row?.SubCategories ?? [];
const rowFields = (row) => row?.fields ?? row?.Fields ?? [];

const dataTypeOptions = [
  { value: "text", label: "Metin" },
  { value: "date", label: "Tarih" },
  { value: "file", label: "Dosya" },
];

const statusTagStyle = {
  borderRadius: 999,
  minWidth: 52,
  textAlign: "center",
  fontWeight: 600,
  border: "none",
};

const defaultCategoryRow = () => ({
  name: undefined,
  sortOrder: 0,
  isActive: true,
});

const defaultSubCategoryRow = () => ({
  name: undefined,
  sortOrder: 0,
  isActive: true,
});

const defaultFieldRow = () => ({
  label: undefined,
  dataType: "text",
  isRequired: false,
  sortOrder: 0,
  isActive: true,
});

export default function RequestParameters() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [modal, setModal] = useState({ type: null, record: null });
  const [form] = Form.useForm();

  const selectedCategory = useMemo(
    () => tree.find((c) => Number(rowId(c)) === Number(selectedCategoryId)),
    [selectedCategoryId, tree]
  );
  const subCategories = useMemo(() => rowSubs(selectedCategory), [selectedCategory]);
  const selectedSubCategory = useMemo(
    () => subCategories.find((s) => Number(rowId(s)) === Number(selectedSubCategoryId)),
    [selectedSubCategoryId, subCategories]
  );
  const fields = useMemo(() => rowFields(selectedSubCategory), [selectedSubCategory]);

  const load = async () => {
    setLoading(true);
    try {
      const list = unwrapList(await getRequestCategories());
      setTree(list);
      if (!selectedCategoryId && list.length > 0) setSelectedCategoryId(rowId(list[0]));
    } catch {
      message.error("Talep parametreleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!subCategories.some((s) => Number(rowId(s)) === Number(selectedSubCategoryId))) {
      setSelectedSubCategoryId(subCategories[0] ? rowId(subCategories[0]) : null);
    }
  }, [selectedSubCategoryId, subCategories]);

  const openModal = (type, record = null) => {
    const values =
      type === "category"
        ? record
          ? {
              name: rowName(record),
              sortOrder: rowSort(record),
              isActive: record?.isActive ?? record?.IsActive ?? true,
            }
          : {
              categories: [defaultCategoryRow()],
            }
        : type === "sub"
          ? record
            ? {
                categoryId: record?.categoryId ?? record?.CategoryId ?? selectedCategoryId,
                name: rowName(record),
                sortOrder: rowSort(record),
                isActive: record?.isActive ?? record?.IsActive ?? true,
              }
            : {
                categoryId: selectedCategoryId,
                subCategories: [defaultSubCategoryRow()],
              }
          : record
            ? {
                subCategoryId: record?.subCategoryId ?? record?.SubCategoryId ?? selectedSubCategoryId,
                fieldKey: record?.fieldKey ?? record?.FieldKey,
                label: record?.label ?? record?.Label,
                dataType: record?.dataType ?? record?.DataType ?? "text",
                isRequired: record?.isRequired ?? record?.IsRequired ?? false,
                sortOrder: rowSort(record),
                isActive: record?.isActive ?? record?.IsActive ?? true,
              }
            : {
                subCategoryId: selectedSubCategoryId,
                fields: [defaultFieldRow()],
              };
    form.setFieldsValue(values);
    setModal({ type, record });
  };

  const closeModal = () => {
    form.resetFields();
    setModal({ type: null, record: null });
  };

  const submit = async () => {
    const values = await form.validateFields();
    try {
      if (modal.type === "category") {
        if (modal.record) {
          await updateRequestCategory(rowId(modal.record), values);
        } else {
          const rows = (values.categories || []).filter((category) => String(category?.name || "").trim());
          const names = rows.map((category) => String(category.name || "").trim().toLocaleLowerCase("tr-TR"));
          if (new Set(names).size !== names.length) {
            message.error("Aynı isimde birden fazla kategori eklenemez.");
            return;
          }

          for (const category of rows) {
            await addRequestCategory(category);
          }
        }
      } else if (modal.type === "sub") {
        const categoryId = values.categoryId ?? selectedCategoryId;
        if (modal.record) {
          const payload = { ...values, categoryId };
          await updateRequestSubCategory(rowId(modal.record), payload);
        } else {
          const rows = (values.subCategories || []).filter((sub) => String(sub?.name || "").trim());
          const names = rows.map((sub) => String(sub.name || "").trim().toLocaleLowerCase("tr-TR"));
          if (new Set(names).size !== names.length) {
            message.error("Aynı isimde birden fazla alt kategori eklenemez.");
            return;
          }

          for (const sub of rows) {
            await addRequestSubCategory({
              ...sub,
              categoryId,
            });
          }
        }
      } else if (modal.type === "field") {
        const subCategoryId = values.subCategoryId ?? selectedSubCategoryId;
        if (modal.record) {
          const payload = { ...values, subCategoryId };
          await updateRequestSubCategoryField(rowId(modal.record), payload);
        } else {
          const rows = (values.fields || []).filter((field) => String(field?.label || "").trim());
          const labels = rows.map((field) => String(field.label || "").trim().toLocaleLowerCase("tr-TR"));
          if (new Set(labels).size !== labels.length) {
            message.error("Aynı isimde birden fazla alan eklenemez.");
            return;
          }

          for (const field of rows) {
            await addRequestSubCategoryField({
              ...field,
              subCategoryId,
            });
          }
        }
      }
      message.success("İşlem başarılı.");
      closeModal();
      load();
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.Message || "İşlem tamamlanamadı.");
    }
  };

  const categoryColumns = [
    { title: "Kategori", dataIndex: "name", render: (_, r) => rowName(r) },
    { title: "Sıra", width: 70, align: "center", render: (_, r) => rowSort(r) },
    {
      title: "İşlem",
      width: 95,
      align: "center",
      render: (_, r) => (
        <Space className="request-param-actions">
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal("category", r)} />
          <Popconfirm title="Kategori pasifleştirilsin mi?" onConfirm={() => deleteRequestCategory(rowId(r)).then(load)}>
            <Button danger type="text">
              <i className="ion-android-delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subColumns = [
    { title: "Alt Kategori", dataIndex: "name", render: (_, r) => rowName(r) },
    { title: "Sıra", width: 70, align: "center", render: (_, r) => rowSort(r) },
    {
      title: "İşlem",
      width: 95,
      align: "center",
      render: (_, r) => (
        <Space className="request-param-actions">
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal("sub", r)} />
          <Popconfirm title="Alt kategori pasifleştirilsin mi?" onConfirm={() => deleteRequestSubCategory(rowId(r)).then(load)}>
            <Button danger type="text">
              <i className="ion-android-delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fieldColumns = [
    { title: "Alan Adı", render: (_, r) => r.label ?? r.Label },
    { title: "Tip", width: 80, align: "center", render: (_, r) => dataTypeOptions.find((x) => x.value === (r.dataType ?? r.DataType))?.label || r.dataType || r.DataType },
    { title: "Zorunlu", width: 80, align: "center", render: (_, r) => ((r.isRequired ?? r.IsRequired) ? <Tag color="success" style={statusTagStyle}>Evet</Tag> : <Tag color="error" style={statusTagStyle}>Hayır</Tag>) },
    {
      title: "İşlem",
      width: 95,
      align: "center",
      render: (_, r) => (
        <Space className="request-param-actions">
          <Button type="text" icon={<EditOutlined />} onClick={() => openModal("field", r)} />
          <Popconfirm title="Dinamik alan pasifleştirilsin mi?" onConfirm={() => deleteRequestSubCategoryField(rowId(r)).then(load)}>
            <Button danger type="text">
              <i className="ion-android-delete" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card
          className="request-param-card"
          title="Kategoriler"
          size="small"
          extra={
            <Button className="request-param-primary-btn" type="primary" icon={<PlusCircleOutlined />} onClick={() => openModal("category")}>
              Kategori Ekle
            </Button>
          }
        >
          <Table
            rowKey={(r) => rowId(r)}
            dataSource={tree}
            columns={categoryColumns}
            loading={loading}
            size="small"
            className="request-param-table"
            rowClassName="request-param-row"
            pagination={false}
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedCategoryId ? [selectedCategoryId] : [],
              onChange: ([key]) => setSelectedCategoryId(key),
            }}
          />
        </Card>

        <Card
          className="request-param-card"
          title={selectedCategory ? `${rowName(selectedCategory)} - Alt Kategoriler` : "Alt Kategoriler"}
          size="small"
          extra={
            <Button className="request-param-primary-btn" type="primary" disabled={!selectedCategoryId} icon={<PlusCircleOutlined />} onClick={() => openModal("sub")}>
              Alt Kategori Ekle
            </Button>
          }
        >
          <Table
            rowKey={(r) => rowId(r)}
            dataSource={subCategories}
            columns={subColumns}
            size="small"
            className="request-param-table"
            rowClassName="request-param-row"
            pagination={false}
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedSubCategoryId ? [selectedSubCategoryId] : [],
              onChange: ([key]) => setSelectedSubCategoryId(key),
            }}
          />
        </Card>

        <Card
          className="request-param-card"
          title={selectedSubCategory ? `${rowName(selectedSubCategory)} - Dinamik Ek Alanlar` : "Dinamik Ek Alanlar"}
          size="small"
          extra={
            <Button className="request-param-primary-btn" type="primary" disabled={!selectedSubCategoryId} icon={<PlusCircleOutlined />} onClick={() => openModal("field")}>
              Alan Ekle
            </Button>
          }
        >
          <Table rowKey={(r) => rowId(r)} dataSource={fields} columns={fieldColumns} size="small" className="request-param-table" rowClassName="request-param-row" pagination={false} />
        </Card>
      </Space>

      <Modal
        visible={Boolean(modal.type)}
        title={modal.record ? "Düzenle" : "Yeni Kayıt"}
        onCancel={closeModal}
        onOk={submit}
        okText="Kaydet"
        cancelText="İptal"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {modal.type === "category" && (
            modal.record ? (
              <>
                <Form.Item name="name" label="Kategori Adı" rules={[{ required: true, message: "Kategori adı zorunludur." }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="sortOrder" label="Sıra">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="isActive" label="Aktif" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </>
            ) : (
              <Form.List name="categories">
                {(categoryRows, { add, remove }) => (
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {categoryRows.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Kategori ${index + 1}`}
                        extra={
                          categoryRows.length > 1 ? (
                            <Button danger type="text" onClick={() => remove(field.name)}>
                              Sil
                            </Button>
                          ) : null
                        }
                      >
                        <Form.Item
                          name={[field.name, "name"]}
                          label="Kategori Adı"
                          rules={[{ required: true, message: "Kategori adı zorunludur." }]}
                        >
                          <Input placeholder="Örn: İnsan Kaynakları" />
                        </Form.Item>
                        <Form.Item name={[field.name, "sortOrder"]} label="Sıra">
                          <InputNumber style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name={[field.name, "isActive"]} label="Aktif" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Card>
                    ))}
                    <Button type="dashed" block icon={<PlusCircleOutlined />} onClick={() => add(defaultCategoryRow())}>
                      Yeni Kategori Satırı Ekle
                    </Button>
                  </Space>
                )}
              </Form.List>
            )
          )}

          {modal.type === "sub" && (
            <>
              <Form.Item name="categoryId" label="Kategori" rules={[{ required: true, message: "Kategori seçiniz." }]}>
                <Select options={tree.map((c) => ({ value: rowId(c), label: rowName(c) }))} />
              </Form.Item>

              {modal.record ? (
                <>
                  <Form.Item name="name" label="Alt Kategori Adı" rules={[{ required: true, message: "Alt kategori adı zorunludur." }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="sortOrder" label="Sıra">
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="isActive" label="Aktif" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </>
              ) : (
                <Form.List name="subCategories">
                  {(subRows, { add, remove }) => (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {subRows.map((field, index) => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`Alt Kategori ${index + 1}`}
                          extra={
                            subRows.length > 1 ? (
                              <Button danger type="text" onClick={() => remove(field.name)}>
                                Sil
                              </Button>
                            ) : null
                          }
                        >
                          <Form.Item
                            name={[field.name, "name"]}
                            label="Alt Kategori Adı"
                            rules={[{ required: true, message: "Alt kategori adı zorunludur." }]}
                          >
                            <Input placeholder="Örn: Çalışma Belgesi" />
                          </Form.Item>
                          <Form.Item name={[field.name, "sortOrder"]} label="Sıra">
                            <InputNumber style={{ width: "100%" }} />
                          </Form.Item>
                          <Form.Item name={[field.name, "isActive"]} label="Aktif" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Card>
                      ))}
                      <Button type="dashed" block icon={<PlusCircleOutlined />} onClick={() => add(defaultSubCategoryRow())}>
                        Yeni Alt Kategori Satırı Ekle
                      </Button>
                    </Space>
                  )}
                </Form.List>
              )}
            </>
          )}

          {modal.type === "field" && (
            <>
              <Form.Item name="subCategoryId" label="Alt Kategori" rules={[{ required: true, message: "Alt kategori seçiniz." }]}>
                <Select options={subCategories.map((s) => ({ value: rowId(s), label: rowName(s) }))} />
              </Form.Item>

              {modal.record ? (
                <>
                  <Form.Item name="label" label="Alan Adı" rules={[{ required: true, message: "Alan adı zorunludur." }]}>
                    <Input placeholder="Örn: Teslim Tarihi" />
                  </Form.Item>
                  <Form.Item name="fieldKey" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name="dataType" label="Veri Tipi" rules={[{ required: true, message: "Veri tipi seçiniz." }]}>
                    <Select options={dataTypeOptions} />
                  </Form.Item>
                  <Form.Item name="isRequired" label="Zorunlu" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="sortOrder" label="Sıra">
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="isActive" label="Aktif" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </>
              ) : (
                <Form.List name="fields">
                  {(fieldRows, { add, remove }) => (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                      {fieldRows.map((field, index) => (
                        <Card
                          key={field.key}
                          size="small"
                          title={`Dinamik Alan ${index + 1}`}
                          extra={
                            fieldRows.length > 1 ? (
                              <Button danger type="text" onClick={() => remove(field.name)}>
                                Sil
                              </Button>
                            ) : null
                          }
                        >
                          <Form.Item
                            name={[field.name, "label"]}
                            label="Alan Adı"
                            rules={[{ required: true, message: "Alan adı zorunludur." }]}
                          >
                            <Input placeholder="Örn: Teslim Tarihi" />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, "dataType"]}
                            label="Veri Tipi"
                            rules={[{ required: true, message: "Veri tipi seçiniz." }]}
                          >
                            <Select options={dataTypeOptions} />
                          </Form.Item>
                          <Form.Item name={[field.name, "isRequired"]} label="Zorunlu" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                          <Form.Item name={[field.name, "sortOrder"]} label="Sıra">
                            <InputNumber style={{ width: "100%" }} />
                          </Form.Item>
                          <Form.Item name={[field.name, "isActive"]} label="Aktif" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Card>
                      ))}
                      <Button type="dashed" block icon={<PlusCircleOutlined />} onClick={() => add(defaultFieldRow())}>
                        Yeni Alan Satırı Ekle
                      </Button>
                    </Space>
                  )}
                </Form.List>
              )}
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}
