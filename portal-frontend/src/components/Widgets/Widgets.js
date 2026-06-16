import React from "react";
import clone from "clone";
import { Row, Col } from "antd";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import basicStyle from "@iso/assets/styles/constants";
import IsoWidgetsWrapper from "./WidgetsWrapper";
import IsoWidgetBox from "./WidgetBox";
import CardWidget from "./Card/CardWidget";
import ProgressWidget from "./Progress/ProgressWidget";
import StickerWidget from "./Sticker/StickerWidget";
import VCardWidget from "./vCard/vCardWidget";
import SocialWidget from "./SocialWidget/SocialWidget";
import SocialProfile from "./SocialWidget/SocialProfileIcon";
import userpic from "@iso/assets/images/user1.png";
import {
  TableViews,
  tableinfos,
  dataList,
} from "../Tables/AntTables/AntTables";
import IntlMessages from "@iso/components/utility/intlMessages";

const tableDataList = clone(dataList);
tableDataList.size = 5;
const styles = {
  wisgetPageStyle: {
    display: "flex",
    flexFlow: "row wrap",
    alignItems: "flex-start",
    overflow: "hidden",
  },
};
//

const STICKER_WIDGET = [
  {
    number: "235",
    text: "Toplam Ticket",
    icon: "ion-flag",
    fontColor: "#ffffff",
    bgColor: "#7266BA",
  },
  {
    number: "213",
    text: "Tamamlanan Ticket",
    icon: "ion-paper-airplane",
    fontColor: "#ffffff",
    bgColor: "#42A5F6",
  },
  {
    number: "12",
    text: "Yeni Ticket",
    icon: "ion-flash",
    fontColor: "#ffffff",
    bgColor: "#9BC000",
  },
  {
    number: "10",
    text: "Devam Eden Ticket",
    icon: "ion-pin",
    fontColor: "#ffffff",
    bgColor: "#F55555",
  },
];

const CARD_WIDGET = [
  {
    icon: "ion-android-chat",
    iconcolor: "#42A5F5",
    number: "widget.cardwidget1.number",
    text: "widget.cardwidget1.text",
  },
  {
    icon: "ion-music-note",
    iconcolor: "#F75D81",
    number: "widget.cardwidget2.number",
    text: "widget.cardwidget2.text",
  },
  {
    icon: "ion-trophy",
    iconcolor: "#FEAC01",
    number: "widget.cardwidget3.number",
    text: "widget.cardwidget3.text",
  },
];

const PROGRESS_WIDGET = [
  {
    label: "widget.progresswidget1.label",
    details: "widget.progresswidget1.details",
    icon: "ion-archive",
    iconcolor: "#4482FF",
    percent: 50,
    barHeight: 7,
    status: "active",
  },
  {
    label: "widget.progresswidget2.label",
    details: "widget.progresswidget2.details",
    icon: "ion-pie-graph",
    iconcolor: "#F75D81",
    percent: 80,
    barHeight: 7,
    status: "active",
  },
  {
    label: "widget.progresswidget3.label",
    details: "widget.progresswidget3.details",
    icon: "ion-android-download",
    iconcolor: "#494982",
    percent: 65,
    barHeight: 7,
    status: "active",
  },
];

const SOCIAL_PROFILE = [
  {
    url: "#",
    icon: "ion-social-facebook",
    iconcolor: "#3b5998",
  },
  {
    url: "#",
    icon: "ion-social-twitter",
    iconcolor: "#00aced",
  },
  {
    url: "#",
    icon: "ion-social-googleplus",
    iconcolor: "#dd4b39",
  },
  {
    url: "#",
    icon: "ion-social-linkedin-outline",
    iconcolor: "#007bb6",
  },
  {
    url: "#",
    icon: "ion-social-dribbble-outline",
    iconcolor: "#ea4c89",
  },
];
export default function () {
  const { rowStyle, colStyle } = basicStyle;

  return (
    <LayoutWrapper>
      <div style={styles.wisgetPageStyle}>
        {/* sticker  */}
        <Row style={rowStyle} gutter={0} justify="start">
          {STICKER_WIDGET.map((widget, idx) => (
            <Col lg={6} md={12} sm={12} xs={24} style={colStyle} key={idx}>
              <IsoWidgetsWrapper>
                {/* Sticker Widget */}
                <StickerWidget
                  number={<IntlMessages id={widget.number} />}
                  text={<IntlMessages id={widget.text} />}
                  icon={widget.icon}
                  fontColor={widget.fontColor}
                  bgColor={widget.bgColor}
                />
              </IsoWidgetsWrapper>
            </Col>
          ))}
        </Row>
        {/* TABLE */}
        <Row style={rowStyle} gutter={0} justify="start">
          <Col lg={24} md={12} sm={24} xs={24} style={colStyle}>
            <IsoWidgetsWrapper>
              <IsoWidgetBox>
                <TableViews.SimpleView
                  tableInfo={tableinfos[0]}
                  dataList={tableDataList}
                />
              </IsoWidgetBox>
            </IsoWidgetsWrapper>
          </Col>
        </Row>

        <Row style={rowStyle} gutter={0} justify="start">
          <Col lg={8} md={12} sm={12} xs={24} style={colStyle}>
            <IsoWidgetsWrapper>
              {/* VCard Widget */}
              <VCardWidget
                style={{ height: "450px" }}
                src={userpic}
                alt="Jhon"
                name={<IntlMessages id="widget.vcardwidget.name" />}
                title={<IntlMessages id="widget.vcardwidget.title" />}
                description={
                  <IntlMessages id="widget.vcardwidget.description" />
                }
              >
                <SocialWidget>
                  {SOCIAL_PROFILE.map((profile, idx) => (
                    <SocialProfile
                      key={idx}
                      url={profile.url}
                      icon={profile.icon}
                      iconcolor={profile.iconcolor}
                    />
                  ))}
                </SocialWidget>
              </VCardWidget>
            </IsoWidgetsWrapper>
          </Col>

          <Col lg={8} md={12} sm={12} xs={24} style={colStyle}>
            {CARD_WIDGET.map((widget, idx) => (
              <IsoWidgetsWrapper key={idx} gutterBottom={20}>
                <CardWidget
                  icon={widget.icon}
                  iconcolor={widget.iconcolor}
                  number={<IntlMessages id={widget.number} />}
                  text={<IntlMessages id={widget.text} />}
                />
              </IsoWidgetsWrapper>
            ))}
          </Col>
          {/* Progress Widget */}
          <Col lg={8} md={12} sm={12} xs={24} style={colStyle}>
            {PROGRESS_WIDGET.map((widget, idx) => (
              <IsoWidgetsWrapper key={idx} gutterBottom={20}>
                <ProgressWidget
                  label={<IntlMessages id={widget.label} />}
                  details={<IntlMessages id={widget.details} />}
                  icon={widget.icon}
                  iconcolor={widget.iconcolor}
                  percent={widget.percent}
                  barHeight={widget.barHeight}
                  status={widget.status}
                />
              </IsoWidgetsWrapper>
            ))}
          </Col>
        </Row>
      </div>
    </LayoutWrapper>
  );
}
