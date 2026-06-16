import React, { useEffect, useState, useMemo } from "react";
import { Breadcrumb, Table, Tag, Tooltip, Button, Spin, Row, Col } from "antd"; // Row, Col eklendi
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import Column from "antd/lib/table/Column";
import { Box } from "./HealthInfo.styles";
import { getHealthInfoById } from "../../Api/HealthInfoApi";
import { useSelector } from "react-redux";
import moment from "moment";
import 'moment/locale/tr';
import { useHistory } from "react-router-dom";
import { ProfileOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";

// --- 1. Searchbar Importu ---
import Searchbar from "./Components/SearchBar"; 

// --- Renk Paleti ---
const COLORS = [ "#A02334", "#FFAD60", "#96CEB4", "#758A93", "#E9B63B", "#C66E52", "#9ECAD6", "#748DAE", "#6f42c1", "#17a2b8", "#20c997", ];
const getColorForString = (str) => { 
  if (!str) return "default"; 
  let hash = 0; 
  for (let i = 0; i < str.length; i++) { 
    hash = str.charCodeAt(i) + ((hash << 5) - hash); 
  } 
  const index = Math.abs(hash % COLORS.length); 
  return COLORS[index]; 
};
moment.locale('tr');

const HealthInfo = () => {
  const intl = useIntl();
  const [healthData, setHealthData] = useState([]); // Ham veri
  const [filteredData, setFilteredData] = useState([]); // Ekranda gösterilecek filtrelenmiş veri
  const [loading, setLoading] = useState(true);
  
  // --- 2. Filtre State'leri ---
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // Sigorta Şirketi için kullanacağız
  const [selectedStatus, setSelectedStatus] = useState("");     // Poliçe Durumu için kullanacağız

  const { id } = useSelector((state) => state.Auth);
  const history = useHistory();

  useEffect(() => {
    const fetchHealthInfo = async () => {
      setLoading(true);
      try {
        const response = await getHealthInfoById(id);
        // Gelen veriyi map'le ve key ekle
        const modifiedData = (response.data || []).map((item) => ({
          ...item,
          key: item.id,
        }));
        setHealthData(modifiedData);
        setFilteredData(modifiedData); // Başlangıçta hepsi görünsün
      } catch (error) {
        console.error("Error fetching health info:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHealthInfo();
    } else {
      setLoading(false);
    }
  }, [id]);

  // --- 3. Filtre Seçeneklerini Oluşturma (Memoize) ---
  // Kategoriler: Sigorta Şirketleri
  const insuranceOptions = useMemo(() => {
    if (!healthData) return [];
    const uniqueCompanies = [...new Set(healthData.map(item => item.insuranceCompanyName).filter(Boolean))];
    return uniqueCompanies.map(comp => ({ label: comp, value: comp }));
  }, [healthData]);

  // Statüler: Poliçe Durumları (Aktif, Pasif vs.)
  const statusOptions = useMemo(() => {
    if (!healthData) return [];
    const uniqueStatuses = [...new Set(healthData.map(item => item.policyStatus).filter(Boolean))];
    return uniqueStatuses.map(stat => ({ label: stat, value: stat }));
  }, [healthData]);

  // --- 4. Filtreleme Mantığı (useEffect) ---
  useEffect(() => {
    if (!healthData) {
        setFilteredData([]);
        return;
    }

    const lowerSearch = search.toLowerCase();

    const filtered = healthData.filter((item) => {
        // Arama: Şirket Adı, Poliçe No veya Poliçe Türü içinde arar
        const matchesSearch = 
            (item.insuranceCompanyName && item.insuranceCompanyName.toLowerCase().includes(lowerSearch)) ||
            (item.insurancePolicyNo && item.insurancePolicyNo.toLowerCase().includes(lowerSearch)) ||
            (item.policyType && item.policyType.toLowerCase().includes(lowerSearch));

        // Kategori Filtresi (Sigorta Şirketi)
        const matchesCategory = selectedCategory ? item.insuranceCompanyName === selectedCategory : true;

        // Statü Filtresi (Poliçe Durumu)
        const matchesStatus = selectedStatus ? item.policyStatus === selectedStatus : true;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    setFilteredData(filtered);

  }, [search, selectedCategory, selectedStatus, healthData]);


  return (
    <>
      <LayoutWrapper>
        <Box style={{ marginTop: "-20px" }}>
          <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
            <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfo.breadcrumb.profile" })}</Breadcrumb.Item>
            <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfo.breadcrumb.healthInfo" })}</Breadcrumb.Item>
          </Breadcrumb>
          <PageHeader>
            <span>{intl.formatMessage({ id: "healthInfo.pageTitle" })}</span>
          </PageHeader>

          {/* --- 5. Searchbar Bileşeni (Responsive) --- */}
          {/* Row ve Col ekleyerek mobilde tam genişlik, masaüstünde yine tam genişlik olmasını sağladık (istenirse masaüstünde daraltılabilir) */}
          <Row style={{ marginBottom: 16, marginTop: 16 }}>
             <Col span={24}>
                <Searchbar
                  search={search}
                  setSearch={setSearch}
                  // Kategoriyi 'Sigorta Şirketi' olarak kullanıyoruz
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categoriesOptions={insuranceOptions}
                  // Statüyü 'Poliçe Durumu' olarak kullanıyoruz
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  statusOptions={statusOptions}
                />
             </Col>
          </Row>

          <Table
            size="small"
            dataSource={filteredData} // --- Veri kaynağı güncellendi ---
            loading={loading}
            rowKey="id"
            // --- YENİ: Scroll Özelliği Eklendi ---
            // Mobilde tablonun taşmasını engeller, yatay kaydırma sağlar
            scroll={{ x: 800 }} 
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            style={{ margin: "0" }}
          >
            <Column 
                title={intl.formatMessage({ id: "healthInfo.table.insuranceCompany" })} 
                dataIndex="insuranceCompanyName" 
                key="insuranceCompanyName" 
                render={(text) => text ? <Tag color={getColorForString(text)}>{text}</Tag> : intl.formatMessage({ id: "healthInfo.common.na" })} 
                sorter={(a, b) => (a.insuranceCompanyName || '').localeCompare(b.insuranceCompanyName || '')} 
            />
            <Column 
                title={intl.formatMessage({ id: "healthInfo.table.policyNumber" })} 
                dataIndex="insurancePolicyNo" 
                key="insurancePolicyNo" 
                render={(text) => text || intl.formatMessage({ id: "healthInfo.common.na" })} 
                sorter={(a, b) => (a.insurancePolicyNo || '').localeCompare(b.insurancePolicyNo || '')} 
            />
            <Column 
                title={intl.formatMessage({ id: "healthInfo.table.policyType" })} 
                dataIndex="policyType" 
                key="policyType" 
                render={(text) => text || '-'} 
                sorter={(a, b) => (a.policyType || '').localeCompare(b.policyType || '')} 
            />
            <Column 
                title={intl.formatMessage({ id: "healthInfo.table.startDate" })} 
                dataIndex="insuranceBeginDate" 
                render={(date) => date && moment(date).isValid() ? moment(date).format("DD.MM.YYYY") : intl.formatMessage({ id: "healthInfo.common.na" })} 
                sorter={(a, b) => moment(a.insuranceBeginDate || 0).diff(moment(b.insuranceBeginDate || 0))} 
            />
            <Column 
                title={intl.formatMessage({ id: "healthInfo.table.endDate" })} 
                dataIndex="insuranceEndDate" 
                render={(date) => {
                    if (!date) return intl.formatMessage({ id: "healthInfo.common.na" }); 
                    const endDate = moment(date);
                    if (!endDate.isValid()) return intl.formatMessage({ id: "healthInfo.common.invalidDate" });
                    return endDate.format("DD.MM.YYYY");
                }} 
                sorter={(a, b) => moment(a.insuranceEndDate || 0).diff(moment(b.insuranceEndDate || 0))} 
            />
            <Column
              title={intl.formatMessage({ id: "healthInfo.table.action" })}
              key="action"
              align="center"
              width={100}
              fixed="right" // Aksiyon butonunu sağa sabitledik
              render={(text, record) => (
                <Tooltip title={intl.formatMessage({ id: "healthInfo.table.viewDetails" })}>
                    <Button
                        type="text"
                        size="small"
                        icon={<ProfileOutlined />}
                        // Yönlendirme URL'sini kontrol et, admin paneliyle aynı detay sayfasını mı kullanacak?
                        // Eğer öyleyse: `/dashboard/admin-healthinfo/details/${record?.id}`
                        // Yoksa kullanıcıya özel bir sayfa mı? Şimdilik senin kodundaki gibi bıraktım.
                        onClick={() => history.push(`/dashboard/healthInfo/details/${record?.id}`)} 
                        disabled={!record?.id}
                    />
                </Tooltip>
              )}
            />
          </Table>

        </Box>
      </LayoutWrapper>
    </>
  );
};

export default HealthInfo;