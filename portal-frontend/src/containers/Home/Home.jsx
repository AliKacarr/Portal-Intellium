// src/containers/Home/Home.jsx

import React, { useMemo, useEffect, useState } from "react";
import {
  Row,
  Col,
  Empty,
  Card,
  List,
  Tag,
  Button,
  Modal,
  Space,
  Typography,
  Tabs,
} from "antd";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import basicStyle from "@iso/assets/styles/constants";
import IsoWidgetsWrapper from "../../components/Widgets/WidgetsWrapper";
import IsoWidgetBox from "../../components/Widgets/WidgetBox";
import ProfileCard from "../../components/Home/ProfileCard";
import TicketCount from "../../components/Home/TicketCount";
import HomeTickets from "../../components/Home/HomeTickets";
import DonutChart from "../../components/Home/DonutChart";
import { GetTicketCount } from "../../Api/TicketApi";
import TeamList from "../../components/Home/TeamList";
import { useSelector } from "react-redux";
import SecureLS from "secure-ls";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";
import HolidayCalendar from "../Permission/components/Calendar/holidayCalendar";
import { GetAllHoliday } from "../../Api/HolidayApi";
import { useIntl } from "react-intl";
import {
  cancelPendingPermission,
  getPermissionsByUserId,
} from "../../Api/PermissionApi";
import { GetMyUserJobDetail } from "../../Api/UserJobDetailApi";
import moment from "moment";

const styles = {
    wisgetPageStyle: {
        display: "flex",
        flexFlow: "row wrap",
        alignItems: "flex-start",
        overflow: "hidden",
        width: "100%",
    },
};

/** Backend: Pending | Confirmed | Declined (Approved/Rejected alias) */
function permissionRawStatus(p) {
  return String(p?.status ?? p?.Status ?? "").trim();
}

function isPendingPermission(p) {
  return permissionRawStatus(p) === "Pending";
}

function isConfirmedPermission(p) {
  const s = permissionRawStatus(p);
  return s === "Confirmed" || s === "Approved";
}

function isDeclinedPermission(p) {
  const s = permissionRawStatus(p);
  return s === "Declined" || s === "Rejected";
}

function sortPermissionsByStartDesc(arr) {
  return [...(arr || [])].sort(
    (a, b) => moment(b.startTime).valueOf() - moment(a.startTime).valueOf()
  );
}

function getDisplayRoleTitle(role, fallbackRole, intl) {
  const raw =
    role?.displayName ??
    role?.DisplayName ??
    role?.description ??
    role?.Description ??
    role?.roleName ??
    role?.RoleName ??
    role?.name ??
    role?.Name ??
    fallbackRole ??
    "";
  const normalized = String(raw || "").trim().toLowerCase();

  if (normalized === "worker-outsource" || normalized === "worker-outsourced") {
    return intl.formatMessage({ id: "home.employee.workerOutsourceRole" });
  }

  if (normalized === "worker") {
    return intl.formatMessage({ id: "home.employee.workerRole" });
  }

  if (normalized === "admin") {
    return intl.formatMessage({ id: "home.employee.adminRole" });
  }

  if (normalized === "user") {
    return intl.formatMessage({ id: "home.employee.userRole" });
  }

  return String(raw || "").trim() || intl.formatMessage({ id: "home.employee.title" });
}

const Home = () => {
    const intl = useIntl();
    const { rowStyle, colStyle, gutter } = basicStyle;
    const dashboardGutterX = 16; // orijinal görsele yakın yatay boşluk
    const dashboardRowGapY = 6; // dikey boşluğu biraz azalt
    const compactColStyle = { ...colStyle, marginBottom: 0 };
    // Admin/worker/user dashboard eski davranış: veri gelmeden de sayfa boş kalmasın.
    // Başta 0'larla render edilir, API gelince güncellenir.
    const [ticketCounts, setTicketCounts] = useState({
      totalCount: 0,
      newRequestCount: 0,
      inProgressCount: 0,
      completedCount: 0,
    });
    const loggedUser = useSelector((state) => state.Auth);
  const ls = useMemo(() => new SecureLS({ encodingType: "aes" }), []);
  const reduxRole = useSelector((state) => {
    const r = state?.Auth?.role;
    if (!r) return null;
    if (typeof r === "string") return r;
    return r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? null;
  });
  const accessToken =
    useSelector((state) => state?.Auth?.accessToken) || ls.get("accessToken");
  const uiRole = useMemo(
    () => resolveUiRole({ reduxRole, accessToken }),
    [reduxRole, accessToken]
  );

  // worker-outsource dashboard verileri
  const [holidays, setHolidays] = useState([]);
  const [nearestHoliday, setNearestHoliday] = useState(null);
  /** worker-outsource: tüm izin talepleri (bekleyen + onay + red) */
  const [myPermissionList, setMyPermissionList] = useState([]);
  const [permissionCounts, setPermissionCounts] = useState({
    pending: 0,
    confirmed: 0,
    declined: 0,
  });
  const [myJobTitle, setMyJobTitle] = useState("");
  const [permLoading, setPermLoading] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);

    // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---

    useEffect(() => {
    // worker-outsource: ticket dashboard'u çağırma
    if (uiRole === "worker-outsource") return;

        // API isteği yapacak fonksiyonu useEffect'in içine alıyoruz.
        // Bu, en güncel 'loggedUser' verisini kullanmasını garantiler.
        const fetchData = async () => {
            try {
                let response = await GetTicketCount(loggedUser);
                setTicketCounts(response.data.data);
            } catch (error) {
                console.error("Error while fetching dashboard data:", error);
            }
        };

        // EN ÖNEMLİ KONTROL:
        // Sadece 'loggedUser' ve içinde 'id' bilgisi varsa API isteğini yap.
        if (loggedUser && loggedUser.id) {
            fetchData();
        }

  }, [loggedUser, uiRole]); // <-- Dependency array'e 'loggedUser' ekledik.
                      // Bu sayede Redux'tan kullanıcı bilgisi geldiği an bu kod çalışır.
    
    // --- DEĞİŞİKLİK BURADA BİTİYOR ---

  useEffect(() => {
    if (uiRole !== "worker-outsource") return;
    let cancelled = false;

    const loadHolidays = async () => {
      setHolidayLoading(true);
      try {
        const res = await GetAllHoliday();
        const list = res?.data?.data || [];
        if (cancelled) return;
        setHolidays(Array.isArray(list) ? list : []);

        const now = moment().startOf("day");
        const upcoming = (Array.isArray(list) ? list : [])
          .map((h) => ({
            ...h,
            _start: moment(h.startTime),
            _end: moment(h.endTime),
          }))
          .filter((h) => h._end.isSameOrAfter(now))
          .sort((a, b) => a._start.valueOf() - b._start.valueOf());
        setNearestHoliday(upcoming[0] || null);
      } catch (e) {
        if (!cancelled) setNearestHoliday(null);
      } finally {
        if (!cancelled) setHolidayLoading(false);
      }
    };

    const loadPermissions = async () => {
      if (!loggedUser?.id) return;
      setPermLoading(true);
      try {
        const res = await getPermissionsByUserId(loggedUser.id);
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setMyPermissionList(sortPermissionsByStartDesc(arr));

        const pendingCount = arr.filter(isPendingPermission).length;
        const confirmedCount = arr.filter(isConfirmedPermission).length;
        const declinedCount = arr.filter(isDeclinedPermission).length;
        setPermissionCounts({
          pending: pendingCount,
          confirmed: confirmedCount,
          declined: declinedCount,
        });
      } catch (e) {
        if (!cancelled) setMyPermissionList([]);
        if (!cancelled)
          setPermissionCounts({ pending: 0, confirmed: 0, declined: 0 });
      } finally {
        if (!cancelled) setPermLoading(false);
      }
    };

    const loadJobTitle = async () => {
      try {
        const res = await GetMyUserJobDetail();
        const data = res?.data?.data ?? res?.data?.Data ?? res?.data ?? null;
        const title =
          data?.jobTitle ??
          data?.JobTitle ??
          loggedUser?.jobTitle ??
          loggedUser?.JobTitle ??
          "";
        if (!cancelled) setMyJobTitle(String(title || "").trim());
      } catch (e) {
        if (!cancelled) {
          const fallback = loggedUser?.jobTitle ?? loggedUser?.JobTitle ?? "";
          setMyJobTitle(String(fallback || "").trim());
        }
      }
    };

    loadHolidays();
    loadPermissions();
    loadJobTitle();

    return () => {
      cancelled = true;
    };
  }, [uiRole, loggedUser?.id, loggedUser?.jobTitle, loggedUser?.JobTitle]);

  const cancelPermission = async (permission) => {
    if (!loggedUser?.id) return;
    const pid = permission?.id ?? permission?.Id;
    if (!pid) return;
    Modal.confirm({
      title: intl.formatMessage({ id: "home.permissions.cancelConfirmTitle" }),
      content: intl.formatMessage({ id: "home.permissions.cancelConfirmContent" }),
      okText: intl.formatMessage({ id: "home.common.yesCancel" }),
      okType: "danger",
      cancelText: intl.formatMessage({ id: "home.common.cancel" }),
      async onOk() {
        await cancelPendingPermission(loggedUser.id, pid);
        const res = await getPermissionsByUserId(loggedUser.id);
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : raw?.data ?? [];
        const arr = Array.isArray(list) ? list : [];
        setMyPermissionList(sortPermissionsByStartDesc(arr));
        setPermissionCounts({
          pending: arr.filter(isPendingPermission).length,
          confirmed: arr.filter(isConfirmedPermission).length,
          declined: arr.filter(isDeclinedPermission).length,
        });
      },
    });
  };

  if (uiRole === "worker-outsource") {
    const pendingRows = myPermissionList.filter(isPendingPermission);
    const confirmedRows = myPermissionList.filter(isConfirmedPermission);
    const declinedRows = myPermissionList.filter(isDeclinedPermission);

    const renderPermissionDescription = (item) => {
      const desc = item.description || item.Description || "";
      const rr =
        item.rejectReason ?? item.RejectReason ?? item.reject_reason ?? "";
      const extra =
        permissionRawStatus(item) === "Declined" ||
        permissionRawStatus(item) === "Rejected"
          ? rr
            ? `${intl.formatMessage({ id: "home.permissions.rejectionReason" })}: ${rr}`
            : ""
          : "";
      const parts = [desc, extra].filter(Boolean);
      return parts.length ? parts.join(" · ") : null;
    };

    const renderPermissionItem = (item, kind) => {
      const tag =
        kind === "pending" ? (
          <Tag color="gold">{intl.formatMessage({ id: "home.permissions.pending" })}</Tag>
        ) : kind === "confirmed" ? (
          <Tag color="green">{intl.formatMessage({ id: "home.permissions.confirmed" })}</Tag>
        ) : (
          <Tag color="red">{intl.formatMessage({ id: "home.permissions.declined" })}</Tag>
        );
      const actions =
        kind === "pending"
          ? [
              <Button
                danger
                size="small"
                key="del"
                onClick={() => cancelPermission(item)}
              >
                {intl.formatMessage({ id: "home.common.delete" })}
              </Button>,
            ]
          : [];

      const permType = item.permissionType ?? item.PermissionType;

      return (
        <List.Item actions={actions}>
          <List.Item.Meta
            title={
              <Space wrap size="small">
                {tag}
                <span>
                  {moment(item.startTime).format("DD.MM.YYYY")} -{" "}
                  {moment(item.endTime).format("DD.MM.YYYY")}
                </span>
                {permType ? <Tag>{permType}</Tag> : null}
              </Space>
            }
            description={renderPermissionDescription(item)}
          />
        </List.Item>
      );
    };

    const equalHeightColStyle = { ...colStyle, display: "flex" };
    const headerCardStyle = (bg) => ({
      width: "100%",
      borderRadius: 5,
      minHeight: 56,
      color: "#fff",
      background: bg,
      display: "flex",
      alignItems: "stretch",
      overflow: "hidden",
    });
    const headerIconStyle = {
      width: 60,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    };
    const headerIconClassStyle = {
      color: "#fff",
      fontSize: 30,
      lineHeight: 1,
    };
    const headerContentStyle = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "12px 16px",
      lineHeight: 1.2,
    };

    const { Text } = Typography;
    const workerOutsourceRoleTitle = getDisplayRoleTitle(
      loggedUser?.role,
      uiRole,
      intl
    );
    const workerOutsourceJobTitle =
      myJobTitle ||
      loggedUser?.jobTitle ||
      loggedUser?.JobTitle ||
      intl.formatMessage({ id: "home.employee.subtitle" });
    const profileUser = {
      ...loggedUser,
      jobTitle: workerOutsourceJobTitle,
    };

    return (
      <LayoutWrapper>
        <div style={styles.wisgetPageStyle}>
          {/* ÜST ŞERİT (görseldeki kırmızı + mavi kartlar) */}
          <Row style={rowStyle} gutter={0}>
            <Col lg={12} md={24} sm={24} xs={24} style={colStyle}>
              <IsoWidgetsWrapper>
                <div style={headerCardStyle("#F55555")}>
                  <div style={headerIconStyle}>
                    <i className="ion-person" style={headerIconClassStyle} />
                  </div>
                  <div style={headerContentStyle}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {loggedUser?.name || ""}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 12 }}>
                      {loggedUser?.customer?.customerName || ""}
                    </div>
                  </div>
                </div>
              </IsoWidgetsWrapper>
            </Col>
            <Col lg={12} md={24} sm={24} xs={24} style={colStyle}>
              <IsoWidgetsWrapper>
                <div style={headerCardStyle("#42A5F6")}>
                  <div style={headerIconStyle}>
                    <i className="ion-briefcase" style={headerIconClassStyle} />
                  </div>
                  <div style={headerContentStyle}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {workerOutsourceRoleTitle}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 12 }}>
                      {workerOutsourceJobTitle}
                    </div>
                  </div>
                </div>
              </IsoWidgetsWrapper>
            </Col>
          </Row>

          {/* ORTA (profil + takvim) */}
          <Row style={rowStyle} gutter={0}>
            <Col xl={6} lg={8} md={12} sm={24} xs={24} style={equalHeightColStyle}>
              <IsoWidgetsWrapper style={{ width: "100%" }}>
                <IsoWidgetBox style={{ width: "100%", minHeight: "413px" }} padding="0px">
                  <ProfileCard user={profileUser} />
                </IsoWidgetBox>
              </IsoWidgetsWrapper>
            </Col>

            <Col xl={18} lg={16} md={12} sm={24} xs={24} style={equalHeightColStyle}>
              <IsoWidgetsWrapper>
                <IsoWidgetBox
                  style={{ width: "100%", minHeight: "413px" }}
                  padding="16px"
                >
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
                    {intl.formatMessage({ id: "home.calendar.title" })}
                  </div>
                  <HolidayCalendar refreshKey={0} compact={true} minHeight={360} />

                  <div style={{ marginTop: 8, fontSize: 12, color: "#444" }}>
                    <Text strong>{intl.formatMessage({ id: "home.calendar.nearestSpecialDay" })}</Text>{" "}
                    {holidayLoading ? (
                      intl.formatMessage({ id: "home.common.loading" })
                    ) : nearestHoliday ? (
                      <>
                        <Text>
                          {nearestHoliday.name} (
                          {moment(nearestHoliday.startTime).format("DD MMMM YYYY")}
                          {" - "}
                          {moment(nearestHoliday.endTime).format("DD MMMM YYYY")}
                          )
                        </Text>
                        <Text type="secondary">{" - "}{moment(nearestHoliday.startTime).fromNow()}</Text>
                      </>
                    ) : (
                      intl.formatMessage({ id: "home.common.notFound" })
                    )}
                  </div>
                </IsoWidgetBox>
              </IsoWidgetsWrapper>
            </Col>
          </Row>

          {/* ALT (izin talepleri sayacı + bekleyen listesi) */}
          <Row style={rowStyle} gutter={0}>
            <Col lg={24} md={24} sm={24} xs={24} style={colStyle}>
              <IsoWidgetsWrapper>
                <IsoWidgetBox>
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
                    {intl.formatMessage({ id: "home.permissions.myRequests" })}
                  </div>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Tag color="gold">{intl.formatMessage({ id: "home.permissions.pendingCount" }, { count: permissionCounts.pending })}</Tag>
                    <Tag color="green">{intl.formatMessage({ id: "home.permissions.confirmedCount" }, { count: permissionCounts.confirmed })}</Tag>
                    <Tag color="red">{intl.formatMessage({ id: "home.permissions.declinedCount" }, { count: permissionCounts.declined })}</Tag>
                  </Space>

                  <Card size="small" loading={permLoading} bordered={false}>
                    <Tabs
                      defaultActiveKey="pending"
                      size="small"
                      items={[
                        {
                          key: "pending",
                          label: intl.formatMessage({ id: "home.permissions.pendingTab" }, { count: permissionCounts.pending }),
                          children: (
                            <List
                              locale={{ emptyText: intl.formatMessage({ id: "home.permissions.pendingEmpty" }) }}
                              dataSource={pendingRows}
                              renderItem={(item) =>
                                renderPermissionItem(item, "pending")
                              }
                            />
                          ),
                        },
                        {
                          key: "confirmed",
                          label: intl.formatMessage({ id: "home.permissions.confirmedTab" }, { count: permissionCounts.confirmed }),
                          children: (
                            <List
                              locale={{ emptyText: intl.formatMessage({ id: "home.permissions.confirmedEmpty" }) }}
                              dataSource={confirmedRows}
                              renderItem={(item) =>
                                renderPermissionItem(item, "confirmed")
                              }
                            />
                          ),
                        },
                        {
                          key: "declined",
                          label: intl.formatMessage({ id: "home.permissions.declinedTab" }, { count: permissionCounts.declined }),
                          children: (
                            <List
                              locale={{ emptyText: intl.formatMessage({ id: "home.permissions.declinedEmpty" }) }}
                              dataSource={declinedRows}
                              renderItem={(item) =>
                                renderPermissionItem(item, "declined")
                              }
                            />
                          ),
                        },
                      ]}
                    />
                  </Card>
                </IsoWidgetBox>
              </IsoWidgetsWrapper>
            </Col>
          </Row>
        </div>
      </LayoutWrapper>
    );
  }


    return (
        <LayoutWrapper>
            <div style={styles.wisgetPageStyle}>
                {/* ticketCounts'ın dolu olduğundan artık eminiz, bu yüzden baştaki kontrolü kaldırdık */}
                {/* Üst şerit: kutular arası + altına dikey boşluk olmalı */}
                <Row
                  style={{ ...rowStyle, marginBottom: dashboardRowGapY }}
                  gutter={[dashboardGutterX + 4, 0]}
                >
                    <Col lg={6} md={12} sm={12} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <TicketCount
                                number={ticketCounts.totalCount}
                                text={intl.formatMessage({ id: "home.tickets.total" })}
                                icon="ion-flag"
                                fontColor="#fff"
                                bgColor="#F55555"
                            />
                        </IsoWidgetsWrapper>
                    </Col>

                    <Col lg={6} md={12} sm={12} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <TicketCount
                                number={ticketCounts.newRequestCount}
                                text={intl.formatMessage({ id: "home.tickets.new" })}
                                icon="ion-forward"
                                fontColor="#fff"
                                bgColor="#42A5F6"
                            />
                        </IsoWidgetsWrapper>
                    </Col>
                    <Col lg={6} md={12} sm={12} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <TicketCount
                                number={ticketCounts.inProgressCount}
                                text={intl.formatMessage({ id: "home.tickets.inProgress" })}
                                icon="ion-pin"
                                fontColor="#fff"
                                bgColor="#7266BA"
                            />
                        </IsoWidgetsWrapper>
                    </Col>
                    <Col lg={6} md={12} sm={12} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <TicketCount
                                number={ticketCounts.completedCount}
                                text={intl.formatMessage({ id: "home.tickets.completed" })}
                                icon="ion-paper-airplane"
                                fontColor="#fff"
                                bgColor="#9BC000"
                            />
                        </IsoWidgetsWrapper>
                    </Col>
                </Row>
                
                {/* Orta şerit: profil / grafik / ekip arası boşluklar */}
                <Row
                  style={{ ...rowStyle, marginBottom: dashboardRowGapY }}
                  gutter={[dashboardGutterX + 4, 0]}
                >
                    <Col xl={6} lg={8} md={12} sm={24} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <ProfileCard user={loggedUser} />
                        </IsoWidgetsWrapper>
                    </Col>
                    <Col xl={8} lg={16} md={12} sm={24} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <IsoWidgetBox style={{ minHeight: "413px" }}>
                                {ticketCounts && ticketCounts.totalCount > 0 ? (
                                    <DonutChart ticketCounts={ticketCounts} />
                                ) : (
                                    <Empty
                                        style={{ padding: "100px" }}
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </IsoWidgetBox>
                        </IsoWidgetsWrapper>
                    </Col>

                    <Col xl={10} lg={24} md={24} sm={24} xs={24} style={compactColStyle}>
                        <IsoWidgetsWrapper>
                            <IsoWidgetBox>
                                <TeamList loggedUser={loggedUser} />
                            </IsoWidgetBox>
                        </IsoWidgetsWrapper>
                    </Col>
                </Row>
                {/* Alt şerit: Son biletler öncesi boşluk */}
                <Row style={rowStyle} gutter={[dashboardGutterX + 4, 0]}>
                    <Col lg={24} md={24} sm={24} xs={24} style={colStyle}>
                        <IsoWidgetsWrapper>
                            <IsoWidgetBox>
                                <HomeTickets loggedUser={loggedUser} />
                            </IsoWidgetBox>
                        </IsoWidgetsWrapper>
                    </Col>
                </Row>
            </div>
        </LayoutWrapper>
    );
};

export default Home;