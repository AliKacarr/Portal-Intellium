import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";

//Antdesign
import { Space, Row, message, Spin, Tabs } from "antd";
import "antd/dist/antd.css";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import IntlMessages from "@iso/components/utility/intlMessages";
import PageHeader from "@iso/components/utility/pageHeader";
//==== Antdesign ====

//Components
import Searchbar from "./Components/Searchbar";
import PermissionDetails from "./Components/PermissionDetails";
import ConfirmationTable from "./Components/ConfirmationTable";
//==== Components ====

//Data
import { getPermissions } from "../../Api/PermissionApi";
import { UserDetail } from "../../Api/UserApi";
import { GetPermissionTypes } from "../../Api/ParameterApi";
import { LeaveBalanceAdminPanel } from "../LeaveBalance/LeaveBalanceAdmin";
//==== Data ====

const resolvePermissionDisplayName = (permission, permissionTypeMap, intl) => {
  const typeId = permission?.permissionTypeId ?? permission?.PermissionTypeId;
  const row = permissionTypeMap.get(Number(typeId));
  const sub = row?.subPermission ?? row?.SubPermission;
  const main = row?.permission ?? row?.Permission;

  if (sub && String(sub).toLowerCase() !== "default") return sub;
  if (main === "Ücretli") return intl.formatMessage({ id: "confirmationForm.permissionNames.paidLeave" });
  if (main === "Ücretsiz") return intl.formatMessage({ id: "confirmationForm.permissionNames.unpaidLeave" });
  if (main) return main;

  const raw = permission?.permissionType ?? permission?.PermissionType ?? "";
  if (raw === "Ücretli") return intl.formatMessage({ id: "confirmationForm.permissionNames.paidLeave" });
  if (raw === "Ücretsiz") return intl.formatMessage({ id: "confirmationForm.permissionNames.unpaidLeave" });
  return raw || intl.formatMessage({ id: "confirmationForm.labels.permission" });
};

const Confirmation = () => {
  const intl = useIntl();
  const roleName = useSelector((state) => state.Auth?.role?.roleName);
  const isAdmin = roleName === "admin";
  const [, setOpenPdfDrawer] = useState(false);
  
  const [allPermissions, setAllPermissions] = useState([]); 
  const [filteredData, setFilteredData] = useState([]);     
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(undefined); 
  const [selectedStatus, setSelectedStatus] = useState(undefined);     
  const [permissionTypeMap, setPermissionTypeMap] = useState(new Map());

  useEffect(() => {
    const loadPermissionTypes = async () => {
      try {
        const res = await GetPermissionTypes();
        const list = res?.data?.data ?? res?.data ?? [];
        if (!Array.isArray(list)) return;
        setPermissionTypeMap(
          new Map(list.map((x) => [Number(x.id ?? x.Id), x]))
        );
      } catch (e) {
        console.error(intl.formatMessage({ id: "confirmationForm.errors.permissionTypesLoad" }), e);
      }
    };
    loadPermissionTypes();
  }, [intl]);

  const getAllPermissions = async () => {
    setLoading(true);
    try {
      const response = await getPermissions();
      
      if(response && response.data) {
        const updatedPermissions = await Promise.all(
          response.data.map(async (permission) => {
            if(permission.userId){
                try {
                    const userRes = await UserDetail(permission.userId);
                    return {
                      ...permission,
                      permissionTypeDisplayName: resolvePermissionDisplayName(permission, permissionTypeMap, intl),
                      user: userRes.data.data,
                    };
                } catch (e) {
                    return {
                      ...permission,
                      permissionTypeDisplayName: resolvePermissionDisplayName(permission, permissionTypeMap, intl),
                      user: { name: intl.formatMessage({ id: "confirmationForm.labels.unknown" }) },
                    };
                }
            }
            return {
              ...permission,
              permissionTypeDisplayName: resolvePermissionDisplayName(permission, permissionTypeMap, intl),
              user: { name: intl.formatMessage({ id: "confirmationForm.labels.undefined" }) },
            };
          })
        );

        // --- ID'ye GÖRE SIRALAMA (EN YENİ EN ÜSTTE) ---
        updatedPermissions.sort((a, b) => b.id - a.id);
        // ----------------------------------------------

        setAllPermissions(updatedPermissions);
        setFilteredData(updatedPermissions);
      }
    } catch (error) {
        console.error(intl.formatMessage({ id: "confirmationForm.errors.dataFetch" }), error);
        message.error(intl.formatMessage({ id: "confirmationForm.errors.dataFetchMessage" }));
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    getAllPermissions();
  }, [permissionTypeMap]);

  const permissionOptions = useMemo(() => {
    if (!allPermissions) return [];
    const uniqueTypes = [...new Set(allPermissions.map(item => item.permissionTypeDisplayName || item.permissionType).filter(Boolean))];
    return uniqueTypes.map(type => ({ label: type, value: type }));
  }, [allPermissions]);

  const statusOptions = [
    { label: intl.formatMessage({ id: "confirmationForm.status.pending" }), value: "Pending" },
    { label: intl.formatMessage({ id: "confirmationForm.status.confirmed" }), value: "Confirmed" },
    { label: intl.formatMessage({ id: "confirmationForm.status.declined" }), value: "Declined" }
  ];

  useEffect(() => {
    if(!allPermissions) {
        setFilteredData([]);
        return;
    }

    const lowerSearch = search.toLowerCase();

    const filtered = allPermissions.filter((item) => {
      const displayType = item.permissionTypeDisplayName || item.permissionType || "";
      const categoryMatch = selectedCategory ? displayType === selectedCategory : true;
      const statusMatch = selectedStatus ? item.status === selectedStatus : true;
      const searchMatch =
        (displayType && displayType.toLowerCase().includes(lowerSearch)) ||
        (item.user?.name && item.user.name.toLowerCase().includes(lowerSearch)) ||
        (item.status && item.status.toLowerCase().includes(lowerSearch));

      return categoryMatch && statusMatch && searchMatch;
    });

    setFilteredData(filtered);

  }, [selectedCategory, selectedStatus, search, allPermissions]); 

  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
  const [willBeShowDetails, setWillBeShowDetails] = useState(null);
  
  const [messageApi, contextHolder] = message.useMessage();
  const success = (content, type) => {
    messageApi.open({ type, content, duration: 3 });
  };

  const approvalFormsTab = (
    <>
      <Row>
        <Space style={{ width: "100%" }} direction="vertical" size={"middle"}>
          <Searchbar
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            categoriesOptions={permissionOptions}
            statusOptions={statusOptions}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spin size="large" tip={intl.formatMessage({ id: "confirmationForm.labels.loading" })} />
            </div>
          ) : (
            <ConfirmationTable
              data={filteredData}
              openDrawer={setOpenPdfDrawer}
              openDetailsDrawer={setOpenDetailsDrawer}
              setWillBeShowDetails={setWillBeShowDetails}
            />
          )}
        </Space>
      </Row>
      <PermissionDetails
        open={openDetailsDrawer}
        close={setOpenDetailsDrawer}
        data={willBeShowDetails}
        setWillBeShowDetails={setWillBeShowDetails}
        openPdfDrawer={setOpenPdfDrawer}
        messageSuccess={success}
      />
    </>
  );

  return (
    <LayoutWrapper>
      {contextHolder}

      <PageHeader>
        <IntlMessages id="sidebar.approvalProcess" />
      </PageHeader>

      <Box>
        {isAdmin ? (
          <Tabs
            defaultActiveKey="forms"
            destroyInactiveTabPane
            items={[
              {
                key: "forms",
                label: <IntlMessages id="sidebar.approvalForms" />,
                children: approvalFormsTab,
              },
              {
                key: "balance",
                label: <IntlMessages id="sidebar.leaveBalanceAdmin" />,
                children: <LeaveBalanceAdminPanel />,
              },
            ]}
          />
        ) : (
          approvalFormsTab
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default Confirmation;