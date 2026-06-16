import React, { useCallback, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { Button, Breadcrumb, Tabs } from "antd";
import PageHeader from "@iso/components/utility/pageHeader";
import Box from "@iso/components/utility/box";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import ContentHolder from "@iso/components/utility/contentHolder";
import { Link } from "react-router-dom";
import EditUserBasic from "./editUserBasic";
import EditKisiselBilgiler from "../ProfileDetail_Admin/kisiselBilgiler";
import EditIsBilgileri from "../ProfileDetail_Admin/isBilgileri";
import EditIsDeneyimi from "../ProfileDetail_Admin/isDeneyimi";
import EditEgitimBilgileri from "../ProfileDetail_Admin/egitimBilgileri";
import EditDilBilgileri from "../ProfileDetail_Admin/dilBilgileri";
import EditEgitimveSertifikaBilgileri from "../ProfileDetail_Admin/egitimVeSertifika";
import EditAileBilgileri from "../ProfileDetail_Admin/aileBilgileri";
import EditUserDeleteTab from "./EditUserDeleteTab";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import { UserDetail } from "../../Api/UserApi";
function EditUser() {
    const intl = useIntl();
    const { id } = useParams();
    const [user, setUser] = useState();
    const [nameForBreadcrumb, setNameForBreadcrumb] = useState();
    const [tabPosition, setTabPosition] = useState(
        window.innerWidth < 768 ? "top" : "left"
    );
    useEffect(() => {
        const handleResize = () => {
            setTabPosition(window.innerWidth < 768 ? "top" : "left");
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getUserDetail = useCallback(async () => {
        const response = (await UserDetail(id)).data.data;
        setUser(response);
        setNameForBreadcrumb(response.name);
    }, [id]);

    useEffect(() => {
        getUserDetail();
    }, [getUserDetail]);

    const getFilteredTabs = () => {
        const tabsItems = [
            { key: "1", label: intl.formatMessage({ id: "user.edit.tabAccount" }), children: <EditUserBasic user={user} setNameForBreadcrumb={setNameForBreadcrumb} /> },
            { key: "2", label: intl.formatMessage({ id: "user.edit.tabProfile" }), children: <EditKisiselBilgiler userId={id} isUserRole={user?.userRole.roleName === "user"} /> },
            { key: "3", label: intl.formatMessage({ id: "user.edit.tabJobInfo" }), children: <EditIsBilgileri userId={id} isUserRole={user?.userRole.roleName === "user"} /> },
            { key: "4", label: intl.formatMessage({ id: "user.edit.tabJobExp" }), children: <EditIsDeneyimi userId={id} /> },
            { key: "5", label: intl.formatMessage({ id: "user.edit.tabEducation" }), children: <EditEgitimBilgileri userId={id} /> },
            { key: "6", label: intl.formatMessage({ id: "user.edit.tabLanguage" }), children: <EditDilBilgileri userId={id} /> },
            { key: "7", label: intl.formatMessage({ id: "user.edit.tabCertificates" }), children: <EditEgitimveSertifikaBilgileri userId={id} /> },
            { key: "8", label: intl.formatMessage({ id: "user.edit.tabFamily" }), children: <EditAileBilgileri userId={id} /> },
            { key: "9", label: intl.formatMessage({ id: "user.edit.tabDelete" }), children: <EditUserDeleteTab user={user} /> },
        ];


        // Kullanıcı rolüne göre filtreleme
        if (user?.userRole.roleName === "user") {
            return tabsItems.filter(tab => ["1", "2", "9"].includes(tab.key));
        } else {
            return tabsItems;
        }

    };

    return (
        <LayoutWrapper>
            {user && (
                <Box style={{ marginTop: "-20px" }}>
                    <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
                        <Breadcrumb.Item>{intl.formatMessage({ id: "user.edit.breadcrumbUser" })}</Breadcrumb.Item>
                        <Breadcrumb.Item>{intl.formatMessage({ id: "user.edit.breadcrumbEdit" })}</Breadcrumb.Item>
                        <Breadcrumb.Item>{nameForBreadcrumb}</Breadcrumb.Item>
                    </Breadcrumb>
                    <PageHeader>
                        {intl.formatMessage({ id: "user.edit.pageTitle" })}
                    </PageHeader>
                    <div
                        className="isoProjectTableBtn"
                        style={{ width: "100%", textAlign: "right", marginTop: "-70px" }}
                    >
                        <Link to={`/dashboard/UserList`}>
                            <Button type="primary" className="mateAddProjectBtn">
                                {intl.formatMessage({ id: "user.edit.backToList" })}
                            </Button>
                        </Link>
                    </div>

                    <ContentHolder style={{ padding: "10px", marginTop: "40px" }}>
                        <Tabs
                            defaultActiveKey="1"
                            centered
                            style={{ margin: "20px 0" }}
                            tabPosition={tabPosition}
                            tabBarGutter={10}
                            items={getFilteredTabs()}
                        />
                    </ContentHolder>
                </Box>
            )}
        </LayoutWrapper>
    );
}

export default EditUser;
