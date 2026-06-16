import React, { useState, useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { Modal, Form, Select, Button, message, Input, Row, Col, Spin, DatePicker, Alert } from "antd"; 
import { MinusCircleOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons"; 
import axios from "axios";
import { useSelector } from "react-redux";
import moment from "moment"; 
import { host } from "../../../Api/host";
import { getJobByUserId } from "../../../Api/ProfileApi"; 
import { alanlar } from "../../../Data/profileEditData"; 

const DEPARTMENTS = ["Ar&Ge", "Merkez", "Dış Kaynak"];

const NewAssetModal = ({
  open,
  close,
  messageSuccess,
  refreshData,
  preSelectedUserId,
  preSelectedUserName,
  readOnlyReceiver,
  requestedProductId,
  requestedProductLabel,
}) => {
  const intl = useIntl();
  const getApiErrorMessage = (error) => {
    const data = error?.response?.data;
    if (!data) return error?.message || intl.formatMessage({ id: "zimmetBilgileri.common.operationFailed" });
    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.Message) return data.Message;
    return intl.formatMessage({ id: "zimmetBilgileri.common.operationFailed" });
  };
  const [form] = Form.useForm();
  
  // --- STATE'LER ---
  const [allUsersWithJobs, setAllUsersWithJobs] = useState([]); 
  const [filteredUsers, setFilteredUsers] = useState([]);       
  const [allStockProducts, setAllStockProducts] = useState([]); 
  
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  /** Gelen zimmet talebiyle kategori eşleştirme: 'matched' | 'none' | null */
  const [requestCategoryHint, setRequestCategoryHint] = useState(null);

  const { id: currentAdminId, accessToken } = useSelector((state) => state.Auth);
  const token = accessToken || localStorage.getItem("token"); 
  
  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  // 1. MODAL AÇILINCA VERİLERİ ÇEK
  useEffect(() => {
    const initData = async () => {
        setFetchingData(true);
        try {
            // A. Kullanıcıları ve İş Detaylarını Çek
            const userRes = await axiosAuth.get("/api/Users/getuserlist");
const userPayload = userRes?.data;
            const rawUsers = Array.isArray(userPayload)
              ? userPayload
              : Array.isArray(userPayload?.data)
              ? userPayload.data
              : [];
            
            const detailedUsers = await Promise.all(rawUsers.map(async (u) => {
                try {
                    const jobRes = await getJobByUserId(u.id);
                    const jobData = jobRes?.data?.data || {};
                    return {
                        value: u.id,
                        label: u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || intl.formatMessage({ id: "zimmetBilgileri.userNumber" }, { id: u.id }),
                        department: jobData.department || jobData.Department,
                        serviceArea: jobData.serviceArea || jobData.ServiceArea
                    };
                } catch {
                    return { 
                        value: u.id, 
                        label: u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || intl.formatMessage({ id: "zimmetBilgileri.userNumber" }, { id: u.id }), 
                        department: null, 
                        serviceArea: null 
                    };
                }
            }));
            setAllUsersWithJobs(detailedUsers);
            setFilteredUsers(detailedUsers);

            // B. Ürünleri Çek (Sadece Depoda Olanlar)
            const prodRes = await axiosAuth.get("/api/product/getall");
            const allProducts = Array.isArray(prodRes?.data?.data) ? prodRes.data.data : [];
            const stockProducts = allProducts.filter(p => p.status === "Depoda");
            setAllStockProducts(stockProducts);

        } catch (err) {
            console.error("Veri hatası:", err);
            message.error(intl.formatMessage({ id: "zimmetBilgileri.newAsset.loadFailed" }));
        } finally {
            setFetchingData(false);
        }
    };

    if (open) {
        setRequestCategoryHint(null);
        form.resetFields();
        // Varsayılan olarak 1 tane boş ürün satırı ekleyelim
        form.setFieldsValue({ 
            deliveryDate: moment(),
            products: [undefined] 
        });
        setSelectedDept(null);
        setSelectedService(null);
        initData();
    }
  }, [open, axiosAuth, form, intl]);

  useEffect(() => {
    if (open && allUsersWithJobs.length > 0) {
        let matchedUserId = preSelectedUserId;

        // Eger preSelectedUserId ile eslesen bulunamazsa veya gelmediyse userName uzerinden ara
        if (!matchedUserId && preSelectedUserName) {
            const normalizeStr = (s) => (s || "").replace(/\s+/g, "").toLocaleLowerCase('tr-TR');
            const targetName = normalizeStr(preSelectedUserName);
            
            const matchedUser = allUsersWithJobs.find(u => {
                const lbl = normalizeStr(u.label);
                return lbl === targetName || lbl.includes(targetName) || targetName.includes(lbl);
            });
            if (matchedUser) {
                matchedUserId = matchedUser.value;
            }
        }

        // Bulunan userId'yi form'a set et ve bolum/hizmet alani bilgilerini getir
        if (matchedUserId) {
            form.setFieldsValue({ receiverUserId: Number(matchedUserId) });
            handleReceiverChange(Number(matchedUserId));
        } else if (readOnlyReceiver && preSelectedUserName) {
            // Hicbir turlu bulunamazsa form'da en azindan adini gosterelim
            form.setFieldsValue({ receiverUserId: preSelectedUserName, department: '', serviceArea: '' });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill receiver when user list loads; avoid handleReceiverChange churn
  }, [open, preSelectedUserId, preSelectedUserName, allUsersWithJobs]);
  // Gelen talepte ürün seçildiyse: depodaysa otomatik seç; değilse kullanıcıyı yönlendir (kategori değil ürün bazlı)
  useEffect(() => {
    if (!open) {
      setRequestCategoryHint(null);
      return;
    }
    if (fetchingData) return;
    if (!requestedProductId) {
      setRequestCategoryHint(null);
      return;
    }

    const pid = Number(requestedProductId);
    if (!pid || pid <= 0) {
      setRequestCategoryHint(null);
      return;
    }

    const match = allStockProducts.find((p) => Number(p.id) === pid);
    if (match) {
      form.setFieldsValue({ products: [match.id] });
      setRequestCategoryHint({
        kind: "matched",
        count: 1,
        productLabel: requestedProductLabel || `[${match.category}] ${match.brand} ${match.model} - SN: ${match.serialNumber}`,
      });
    } else {
      setRequestCategoryHint({
        kind: "none",
        productLabel: requestedProductLabel || intl.formatMessage({ id: "zimmetBilgileri.newAsset.requestedProductFallback" }),
      });
    }
  }, [open, requestedProductId, requestedProductLabel, allStockProducts, fetchingData, form, intl]);


  // --- ÜRÜN OPTIONS (Filtresiz ama Arama Yapılabilir Liste) ---
  const productOptions = useMemo(() => {
      return allStockProducts.map(p => ({
          value: p.id,
          label: `[${p.category}] ${p.brand} ${p.model} - SN: ${p.serialNumber}`, 
          category: p.category,
          brand: p.brand
      }));
  }, [allStockProducts]);


  // --- PERSONEL FİLTRELEME ---
  useEffect(() => {
    if (!open) {
      return;
    }
    let result = allUsersWithJobs;
    if (selectedDept) result = result.filter(u => u.department === selectedDept);
    if (selectedService) result = result.filter(u => u.serviceArea === selectedService);
    setFilteredUsers(result);
    
    // Eger okuma modundaysak mevcut secimi sakin temizleme
    if (!readOnlyReceiver) {
        const currentReceiver = form.getFieldValue("receiverUserId");
        if (currentReceiver) {
            const exists = result.find(u => Number(u.value) === Number(currentReceiver));
            if (!exists) {
                form.setFieldsValue({ receiverUserId: null, department: '', serviceArea: '' });
            }
        }
    }
}, [open, selectedDept, selectedService, allUsersWithJobs, form, preSelectedUserId, readOnlyReceiver]);

  const handleReceiverChange = (userId) => {
      // Eslestirme yaparken tip farkliliklarini onlemek icin Number kullanildi
      const selectedUser = allUsersWithJobs.find(u => Number(u.value) === Number(userId));
      if (selectedUser) {
          form.setFieldsValue({
              department: selectedUser.department || '',
              serviceArea: selectedUser.serviceArea || ''
          });
      } else {
          form.setFieldsValue({ department: '', serviceArea: '' });
      }
  };

  // ✅ TOPLU ZİMMETLEME FONKSİYONU
  const onFinish = async (values) => {
    setLoading(true);
    
    let finalAdminId = currentAdminId;
    if (!finalAdminId) {
        try {
            const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
            finalAdminId = lsUser.id || lsUser.userId || 0;
        } catch {}
    }

    if (!finalAdminId || finalAdminId === 0) {
        message.error(intl.formatMessage({ id: "zimmetBilgileri.newAsset.sessionError" }));
        setLoading(false);
        return;
    }

    // Seçilen ürünleri al
    const selectedProductIds = values.products;

    if(!selectedProductIds || selectedProductIds.length === 0) {
        message.error(intl.formatMessage({ id: "zimmetBilgileri.newAsset.selectAtLeastOneProduct" }));
        setLoading(false);
        return;
    }

    let successCount = 0;
    let errorCount = 0;
    let zimmetliWarnShown = false;

    const promises = selectedProductIds.map(async (prodId) => {
        if(!prodId) return;

        const payload = {
            ProductId: prodId,
            ReceiverUserId: values.receiverUserId,
            DeliveredUserId: finalAdminId,
            Description: values.description,
            DeliveryDate: values.deliveryDate ? values.deliveryDate.toISOString() : new Date().toISOString(),
        };

        try {
            const res = await axiosAuth.post("/api/debit/add", payload);
            if (res.data.success) {
                successCount++;
            } else {
                errorCount++;
                const msg = res?.data?.message || res?.data?.Message || "";
                if (!zimmetliWarnShown && String(msg).toLowerCase().includes("zimmetli")) {
                  zimmetliWarnShown = true;
                  message.error(intl.formatMessage({ id: "zimmetBilgileri.newAsset.productAlreadyAssigned" }));
                }
            }
        } catch (err) {
            console.error(err);
            errorCount++;
            const msg = getApiErrorMessage(err);
            if (!zimmetliWarnShown && String(msg).toLowerCase().includes("zimmetli")) {
              zimmetliWarnShown = true;
              message.error(intl.formatMessage({ id: "zimmetBilgileri.newAsset.productAlreadyAssigned" }));
            }
        }
    });

    await Promise.all(promises);

    setLoading(false);

    if (successCount > 0 && errorCount === 0) {
        messageSuccess(intl.formatMessage({ id: "zimmetBilgileri.newAsset.assignSuccess" }, { count: successCount }), "success");
        form.resetFields();
        if(refreshData) refreshData();
        close();
    } else if (successCount > 0 && errorCount > 0) {
        message.warning(
          intl.formatMessage({ id: "zimmetBilgileri.newAsset.assignPartial" }, { success: successCount, errors: errorCount })
        );
        if(refreshData) refreshData();
        close();
    } else {
        // Aynı hata için iki farklı uyarı göstermeyelim
        if (!zimmetliWarnShown) {
          message.error(intl.formatMessage({ id: "zimmetBilgileri.newAsset.assignFailed" }));
        }
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "zimmetBilgileri.newAsset.modalTitle" })}
      open={open}
      onCancel={() => close(false)}
      footer={null}
      width={800}
      centered
    >
      <Spin spinning={fetchingData} tip={intl.formatMessage({ id: "zimmetBilgileri.newAsset.spinTip" })}>
          <Form layout="vertical" form={form} onFinish={onFinish}>
            
            {/* 1. PERSONEL SEÇİMİ */}
            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
                <p style={{margin: '0 0 10px 0', fontWeight: 'bold', color: '#666'}}>{intl.formatMessage({ id: "zimmetBilgileri.newAsset.step1Title" })} </p>
                
                {!readOnlyReceiver && (
                <Row gutter={16} style={{marginBottom: 15}}>
                    <Col span={12}>
                        <Form.Item label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.filterDept" })} style={{marginBottom:0}}>
                            <Select placeholder={intl.formatMessage({ id: "zimmetBilgileri.newAsset.placeholderAll" })} allowClear onChange={(val) => setSelectedDept(val)} value={selectedDept}>
                                {DEPARTMENTS.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.filterService" })} style={{marginBottom:0}}>
                            <Select placeholder={intl.formatMessage({ id: "zimmetBilgileri.newAsset.placeholderAll" })} allowClear onChange={(val) => setSelectedService(val)} value={selectedService} showSearch optionFilterProp="children">
                                {alanlar.map((s, index) => <Select.Option key={index} value={s}>{s}</Select.Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                )}

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="receiverUserId"
                            label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.receiverLabel" })}
                            rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgileri.newAsset.receiverRequired" }) }]}
                            style={{marginBottom:0}}
                            help={!readOnlyReceiver && (selectedDept || selectedService) ? intl.formatMessage({ id: "zimmetBilgileri.newAsset.filterResult" }, { count: filteredUsers.length }) : ""}
                        >
                        <Select
                            disabled={readOnlyReceiver}
                            showSearch placeholder={intl.formatMessage({ id: "zimmetBilgileri.newAsset.searchPersonnel" })} optionFilterProp="label"
                            options={filteredUsers} onChange={handleReceiverChange} notFoundContent={intl.formatMessage({ id: "zimmetBilgileri.newAsset.noPersonnel" })}
                        />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="department" label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.department" })} style={{marginBottom:0}}>
                            <Input disabled style={{ color: '#555', cursor: 'default', backgroundColor:'#fff' }} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="serviceArea" label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.serviceArea" })} style={{marginBottom:0}}>
                            <Input disabled style={{ color: '#555', cursor: 'default', backgroundColor:'#fff' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            {/* 2. ÜRÜN SEÇİMİ (Dinamik Liste & Mükerrer Kontrolü) */}
            <div style={{ backgroundColor: '#f0f5ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border:'1px solid #d6e4ff' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
                    <p style={{margin: 0, fontWeight: 'bold', color: '#2f54eb'}}>{intl.formatMessage({ id: "zimmetBilgileri.newAsset.step2Title" })}</p>
                    <small style={{color:'#666'}}>{intl.formatMessage({ id: "zimmetBilgileri.newAsset.stockCount" }, { count: allStockProducts.length })}</small>
                </div>

                {requestCategoryHint?.kind === "matched" && (
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message={intl.formatMessage(
                          { id: "zimmetBilgileri.newAsset.alertMatched" },
                          { label: requestCategoryHint.productLabel }
                        )}
                    />
                )}
                {requestCategoryHint?.kind === "none" && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message={intl.formatMessage(
                          { id: "zimmetBilgileri.newAsset.alertNotInStock" },
                          { label: requestCategoryHint.productLabel }
                        )}
                    />
                )}
                
                {/* shouldUpdate ile form her değiştiğinde burayı render ediyoruz */}
                <Form.Item noStyle shouldUpdate={(prev, current) => prev.products !== current.products}>
                    {({ getFieldValue }) => {
                        const selectedProductIds = getFieldValue('products') || [];

                        return (
                            <Form.List name="products">
                                {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => {
                                        // Bu satırda seçili olan değer
                                        const currentVal = selectedProductIds[name];
                                        
                                        // Her satır için seçenekleri hesapla: Eğer başka satırda seçildiyse disabled yap
                                        const rowOptions = productOptions.map(p => ({
                                            ...p,
                                            disabled: selectedProductIds.includes(p.value) && p.value !== currentVal
                                        }));

                                        return (
                                            <Row key={key} gutter={10} align="middle" style={{ marginBottom: 10 }}>
                                                <Col flex="auto">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name]}
                                                        rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgileri.newAsset.productRequired" }) }]}
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <Select
                                                            showSearch
                                                            placeholder={intl.formatMessage({ id: "zimmetBilgileri.newAsset.selectProductNth" }, { n: index + 1 })}
                                                            optionFilterProp="label"
                                                            options={rowOptions}
                                                            dropdownMatchSelectWidth={false}
                                                            notFoundContent={intl.formatMessage({ id: "zimmetBilgileri.newAsset.noStockProduct" })}
                                                            onChange={() => form.validateFields(['products'])} 
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col flex="40px" style={{textAlign:'center'}}>
                                                    <MinusCircleOutlined 
                                                        style={{ fontSize: '20px', color: '#ff4d4f', cursor: 'pointer' }} 
                                                        onClick={() => remove(name)} 
                                                    />
                                                </Col>
                                            </Row>
                                        );
                                    })}
                                    
                                    <Form.Item style={{ marginBottom: 0 }}>
                                        <Button 
                                            type="dashed" 
                                            onClick={() => add()} 
                                            block 
                                            icon={<PlusOutlined />}
                                            style={{color: '#2f54eb', borderColor: '#2f54eb'}}
                                        >
                                            {intl.formatMessage({ id: "zimmetBilgileri.newAsset.addAnotherProduct" })}
                                        </Button>
                                    </Form.Item>
                                </>
                                )}
                            </Form.List>
                        );
                    }}
                </Form.Item>
            </div>

            <p style={{margin: '0 0 10px 0', fontWeight: 'bold', color: '#666'}}>{intl.formatMessage({ id: "zimmetBilgileri.newAsset.step3Title" })}</p>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        name="deliveryDate"
                        label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.deliveryDate" })}
                        initialValue={moment()} 
                        rules={[{ required: true, message: intl.formatMessage({ id: "zimmetBilgileri.newAsset.deliveryDateRequired" }) }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="description" label={intl.formatMessage({ id: "zimmetBilgileri.newAsset.notesOptional" })}>
                <Input.TextArea placeholder={intl.formatMessage({ id: "zimmetBilgileri.newAsset.notesPlaceholder" })} rows={3} />
            </Form.Item>

            <div style={{ textAlign: "right", marginTop: 20 }}>
              <Button onClick={() => close(false)} style={{ marginRight: 8 }}>{intl.formatMessage({ id: "zimmetBilgileri.newAsset.cancel" })}</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                icon={<ShoppingCartOutlined />}
                style={{backgroundColor: '#722ed1', borderColor: '#722ed1'}}
              >
                {intl.formatMessage({ id: "zimmetBilgileri.newAsset.submitAll" })}
              </Button>
            </div>
          </Form>
      </Spin>
    </Modal>
  );
};

export default NewAssetModal;