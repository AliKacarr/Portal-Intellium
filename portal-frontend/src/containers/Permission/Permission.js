import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { Col, Row, Breadcrumb, Button } from "antd"; 
import { UnorderedListOutlined } from "@ant-design/icons"; 
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { Box } from "../Project/project.styles";

import SideMenu from "./components/SideMenu/holidaySideMenu";
import HolidayCalendar from "./components/Calendar/holidayCalendar";
import HolidayForm from "./components/Form/holidayForm";

import { getTicket, getLeaveEntitlementExplanation } from "../../Api/PermissionApi";

/** IDataResult / axios sarmalayıcılarından UserPermission nesnesini çıkarır */
function extractUserPermissionPayload(permRes) {
  if (!permRes) return null;
  let p = permRes.data ?? permRes.Data;
  if (!p || typeof p !== "object") return null;
  if ("userId" in p || "UserId" in p || "totalLeave" in p || "TotalLeave" in p) return p;
  const inner = p.data ?? p.Data;
  return inner && typeof inner === "object" ? inner : null;
}

const Permission = () => {
  const intl = useIntl();
  const { id } = useSelector((state) => state.Auth);
  const history = useHistory();
  const location = useLocation();
  
  const [userPermissionStats, setUserPermissionStats] = useState({
    totalLeave: 0,
    remainingLeave: 0,
    usedLeave: 0,
    thisYear: 0,
  });
  const [leaveExplanation, setLeaveExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const fetchUserPermissions = useCallback(async (userId) => {
    setExplanationLoading(true);
    try {
      const permRes = await getTicket(userId);
      const p = extractUserPermissionPayload(permRes);
      if (p) {
        const remaining = p.remainingLeave ?? p.RemainingLeave ?? 0;
        setUserPermissionStats({
          totalLeave: p.totalLeave ?? p.TotalLeave ?? 0,
          remainingLeave: remaining,
          usedLeave: p.usedLeave ?? p.UsedLeave ?? 0,
          thisYear: p.thisYear ?? p.ThisYear ?? 0,
        });
      }
    } catch (error) {
      console.error("İzin bilgileri çekilemedi:", error);
    }
    try {
      const explRes = await getLeaveEntitlementExplanation(userId);
      const expl =
        explRes?.data ?? explRes?.Data ?? explRes?.data?.data ?? null;
      setLeaveExplanation(expl);
    } catch (error) {
      console.error("İzin açıklaması alınamadı:", error);
      setLeaveExplanation(null);
    } finally {
      setExplanationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchUserPermissions(id);
    }
  }, [id, location.pathname, fetchUserPermissions]);

  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        id &&
        location.pathname.includes("permission")
      ) {
        fetchUserPermissions(id);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [id, location.pathname, fetchUserPermissions]);

  return (
    <>
      <LayoutWrapper>
        <Box style={{ marginTop: "-20px" }}>
          
          {/* --- ÜST KISIM (HEADER & BUTON) --- */}
          <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              margin: "10px 0 20px 0" 
          }}>
              {/* Sol Taraf: Breadcrumb */}
              <Breadcrumb className="breadcrumb" style={{ margin: 0 }}>
                <Breadcrumb.Item>{intl.formatMessage({ id: "permission.breadcrumb.profile" })}</Breadcrumb.Item>
                <Breadcrumb.Item>{intl.formatMessage({ id: "permission.breadcrumb.leave" })}</Breadcrumb.Item>
              </Breadcrumb>

              {/* Sağ Taraf: Taleplerim Butonu */}
              <Button 
                  type="primary" 
                  icon={<UnorderedListOutlined />}
                  style={{ 
                      backgroundColor: "#fa8c16", // Turuncu
                      borderColor: "#fa8c16", 
                      fontWeight: "500",
                      borderRadius: "4px",
                      // --- HİZALAMA AYARLARI ---
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      gap: "6px" // İkon ile yazı arasına boşluk
                  }} 
                  onClick={() => history.push("/dashboard/my-requests")} 
              >
                  {intl.formatMessage({ id: "permission.myRequestsButton" })}
              </Button>
          </div>
          {/* ---------------------------------- */}

          <PageHeader>{intl.formatMessage({ id: "permission.pageTitle" })}</PageHeader>

          <SideMenu
            stats={userPermissionStats}
            explanation={leaveExplanation}
            explanationLoading={explanationLoading}
          />

          <Row gutter={8}>
            <Col xs={24} md={12}>
              <HolidayForm
                leaveBalance={userPermissionStats}
                onCreated={() => setCalendarRefreshKey((prev) => prev + 1)}
              />
            </Col>
            <Col xs={24} md={12}>
              <HolidayCalendar refreshKey={calendarRefreshKey} />
            </Col>
          </Row>
        </Box>
      </LayoutWrapper>
    </>
  );
};

export default Permission;