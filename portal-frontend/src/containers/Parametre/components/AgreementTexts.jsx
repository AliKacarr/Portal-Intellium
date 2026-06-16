import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, message, Modal, Space, Table, Tabs, Tag, Tooltip, Typography } from "antd";
import { HistoryOutlined, SaveOutlined } from "@ant-design/icons";
import moment from "moment";
import {
  CreateAgreementVersion,
  GetActiveAgreements,
  GetAgreementHistory,
} from "../../../Api/AgreementApi";
import {
  AGREEMENT_TYPES,
  getAgreementByType,
  normalizeApiList,
} from "../../../utils/agreementContent";
import "./AgreementTexts.css";

const { TextArea } = Input;

const getAgreementContent = (agreement) => agreement?.content ?? agreement?.Content ?? "";
const getAgreementId = (agreement) => agreement?.id ?? agreement?.Id;
const getAgreementVersion = (agreement) => agreement?.version ?? agreement?.Version;
const getAgreementType = (agreement) => Number(agreement?.type ?? agreement?.Type);
const getAgreementCreatedAt = (agreement) => agreement?.createdAt ?? agreement?.CreatedAt;
const getAgreementIsActive = (agreement) => Boolean(agreement?.isActive ?? agreement?.IsActive);

const agreementTypeLabel = (type) => {
  if (Number(type) === AGREEMENT_TYPES.KVKK) return "KVKK";
  if (Number(type) === AGREEMENT_TYPES.ACIK_RIZA) return "Açık Rıza";
  return "-";
};

export default function AgreementTexts() {
  const [activeAgreements, setActiveAgreements] = useState([]);
  const [history, setHistory] = useState([]);
  const [contents, setContents] = useState({ kvkk: "", consent: "" });
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savingType, setSavingType] = useState(null);

  const kvkkAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.KVKK);
  const consentAgreement = getAgreementByType(activeAgreements, AGREEMENT_TYPES.ACIK_RIZA);
  const kvkkHistory = history.filter((agreement) => getAgreementType(agreement) === AGREEMENT_TYPES.KVKK);
  const consentHistory = history.filter((agreement) => getAgreementType(agreement) === AGREEMENT_TYPES.ACIK_RIZA);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const [activeResponse, historyResponse] = await Promise.all([
        GetActiveAgreements(),
        GetAgreementHistory(),
      ]);
      const activeList = normalizeApiList(activeResponse);
      setActiveAgreements(activeList);
      setHistory(normalizeApiList(historyResponse));
      setContents({
        kvkk: getAgreementContent(getAgreementByType(activeList, AGREEMENT_TYPES.KVKK)),
        consent: getAgreementContent(getAgreementByType(activeList, AGREEMENT_TYPES.ACIK_RIZA)),
      });
    } catch (error) {
      message.error("KVKK ve açık rıza metinleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleContentChange = (key, value) => {
    setContents((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (type, contentKey, title) => {
    const content = contents[contentKey]?.trim();
    if (!content) {
      message.error("Sözleşme metni boş olamaz.");
      return;
    }

    Modal.confirm({
      title: "Emin misiniz?",
      content: (
        <span>
          <strong>{title}</strong> için yeni bir versiyon oluşturulacak. Mevcut aktif metin pasif hale gelir;
          tüm kullanıcılar bir sonraki girişte güncel metni kabul etmek zorunda kalacaktır.
        </span>
      ),
      okText: "Evet, yeni versiyon oluştur",
      cancelText: "Vazgeç",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setSavingType(type);
          await CreateAgreementVersion({ type, content });
          message.success("Yeni sözleşme versiyonu oluşturuldu.");
          await fetchAgreements();
        } catch (error) {
          message.error(error?.response?.data?.message || "Sözleşme güncellenemedi.");
        } finally {
          setSavingType(null);
        }
      },
    });
  };

  const historyColumns = useMemo(
    () => [
      {
        title: "Tip",
        key: "type",
        width: 110,
        render: (_, record) => agreementTypeLabel(getAgreementType(record)),
      },
      {
        title: "Versiyon",
        key: "version",
        width: 100,
        render: (_, record) => <Tag color="blue">v{getAgreementVersion(record)}</Tag>,
      },
      {
        title: "Durum",
        key: "isActive",
        width: 100,
        render: (_, record) => (
          <Tag color={getAgreementIsActive(record) ? "green" : "default"}>
            {getAgreementIsActive(record) ? "Aktif" : "Pasif"}
          </Tag>
        ),
      },
      {
        title: "Eklenme Tarihi",
        key: "createdAt",
        width: 170,
        render: (_, record) => {
          const value = getAgreementCreatedAt(record);
          const parsed = value ? moment(value) : null;
          if (!parsed?.isValid()) return "-";
          return (
            <Tooltip title={parsed.format("DD.MM.YYYY HH:mm:ss")}>
              <span>{parsed.format("DD.MM.YYYY HH:mm")}</span>
            </Tooltip>
          );
        },
      },
      {
        title: "İçerik",
        key: "content",
        render: (_, record) => (
          <Typography.Paragraph
            ellipsis={{ rows: 3, expandable: true, symbol: "devamı" }}
            style={{ marginBottom: 0, whiteSpace: "pre-line" }}
          >
            {getAgreementContent(record)}
          </Typography.Paragraph>
        ),
      },
    ],
    []
  );

  const renderEditor = ({ title, type, contentKey, agreement }) => (
    <Card
      className="agreement-texts-editor"
      title={
        <Space direction="vertical" size={0} style={{ width: "100%" }}>
          <Typography.Title level={5} className="agreement-texts-editor-title" style={{ color: "#1890ff" }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">
            Aktif versiyon: {agreement ? `v${getAgreementVersion(agreement)}` : "-"}
          </Typography.Text>
        </Space>
      }
      style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "none" }}
      size="small"
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={savingType === type}
          onClick={() => handleSave(type, contentKey, title)}
        >
          Güncelle (Yeni Versiyon Oluştur)
        </Button>
      }
    >
      <TextArea
        rows={18}
        value={contents[contentKey]}
        onChange={(e) => handleContentChange(contentKey, e.target.value)}
        placeholder={`${title} metnini girin`}
        style={{ resize: "vertical", borderRadius: 8, lineHeight: 1.6 }}
      />
    </Card>
  );

  return (
    <Card
      className="agreement-texts-root"
      title={<Typography.Title level={5} style={{ margin: 0, color: "#1890ff" }}>KVKK ve Rıza Metinleri</Typography.Title>}
      loading={loading}
      style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "none" }}
      extra={
        <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
          Geçmiş Versiyonlar
        </Button>
      }
    >
      <div className="agreement-texts-grid">
        {renderEditor({
          title: "KVKK Aydınlatma Metni",
          type: AGREEMENT_TYPES.KVKK,
          contentKey: "kvkk",
          agreement: kvkkAgreement,
        })}
        {renderEditor({
          title: "Açık Rıza Metni",
          type: AGREEMENT_TYPES.ACIK_RIZA,
          contentKey: "consent",
          agreement: consentAgreement,
        })}
      </div>

      <Modal
        title="Geçmiş Sözleşme Versiyonları"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setHistoryOpen(false)}>
            Kapat
          </Button>,
        ]}
        width={1000}
        className="agreement-texts-history-modal"
      >
        <Tabs
          defaultActiveKey="kvkk"
          items={[
            {
              key: "kvkk",
              label: `KVKK Geçmişi (${kvkkHistory.length})`,
              children: (
                <Table
                  dataSource={kvkkHistory}
                  columns={historyColumns}
                  rowKey={(record) => getAgreementId(record)}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 900 }}
                />
              ),
            },
            {
              key: "consent",
              label: `Açık Rıza Geçmişi (${consentHistory.length})`,
              children: (
                <Table
                  dataSource={consentHistory}
                  columns={historyColumns}
                  rowKey={(record) => getAgreementId(record)}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 900 }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  );
}
