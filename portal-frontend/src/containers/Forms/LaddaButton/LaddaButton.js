import React from 'react';
import { Col, Row } from 'antd';

import LaddaButton, {
  XL,
  L,
  XS,
  S,
  CONTRACT,
  EXPAND_RIGHT,
  SLIDE_LEFT,
  SLIDE_UP,
  ZOOM_IN,
  ZOOM_OUT,
} from 'react-ladda';
import PageHeader from '@iso/components/utility/pageHeader';
import Box from '@iso/components/utility/box';
import LayoutWrapper from '@iso/components/utility/layoutWrapper';
import ContentHolder from '@iso/components/utility/contentHolder';
import IntlMessages from '@iso/components/utility/intlMessages';
import './laddaButton.css';

export default function() {
  const [loading, setLoading] = React.useState(false);

  const toggle = () => {
    setLoading(loading => !loading);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  const rowStyle = {
    width: '100%',
    display: 'flex',
    flexFlow: 'row wrap',
  };
  const colStyle = {
    marginBottom: '16px',
  };
  const gutter = 16;
  return (
    <LayoutWrapper>
      <PageHeader><IntlMessages id="forms.extra.laddaButton" /></PageHeader>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.extra.buttonOne" />} subtitle={<IntlMessages id="forms.extra.slideUp" />}>
            <ContentHolder>
              <LaddaButton
                loading={loading}
                onClick={toggle}
                data-color="#eee"
                data-size={XL}
                data-style={SLIDE_UP}
                data-spinner-size={30}
                data-spinner-color="#fff"
                data-spinner-lines={12}
              >
                <IntlMessages id="forms.extra.clickHere" />
              </LaddaButton>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.extra.buttonTwo" />} subtitle={<IntlMessages id="forms.extra.slideLeft" />}>
            <ContentHolder>
              <LaddaButton
                loading={loading}
                onClick={toggle}
                data-color="#eee"
                data-size={XL}
                data-style={SLIDE_LEFT}
                data-spinner-size={30}
                data-spinner-color="#fff"
                data-spinner-lines={12}
              >
                <IntlMessages id="forms.extra.clickHere" />
              </LaddaButton>
            </ContentHolder>
          </Box>
        </Col>
      </Row>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.extra.buttonThree" />} subtitle={<IntlMessages id="forms.extra.zoomIn" />}>
            <ContentHolder>
              <LaddaButton
                loading={loading}
                onClick={toggle}
                data-color="#eee"
                data-size={L}
                data-style={ZOOM_IN}
                data-spinner-size={30}
                data-spinner-color="#fff"
                data-spinner-lines={12}
              >
                <IntlMessages id="forms.extra.clickHere" />
              </LaddaButton>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.extra.buttonFour" />} subtitle={<IntlMessages id="forms.extra.slideOut" />}>
            <ContentHolder>
              <LaddaButton
                loading={loading}
                onClick={toggle}
                data-color="#eee"
                data-size={S}
                data-style={ZOOM_OUT}
                data-spinner-size={30}
                data-spinner-color="#fff"
                data-spinner-lines={12}
              >
                <IntlMessages id="forms.extra.clickHere" />
              </LaddaButton>
            </ContentHolder>
          </Box>
        </Col>
      </Row>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.extra.buttonFive" />} subtitle={<IntlMessages id="forms.extra.expandRight" />}>
            <ContentHolder>
              <LaddaButton
                loading={loading}
                onClick={toggle}
                data-color="#eee"
                data-size={XL}
                data-style={EXPAND_RIGHT}
                data-spinner-size={30}
                data-spinner-color="#fff"
                data-spinner-lines={12}
              >
                <IntlMessages id="forms.extra.clickHere" />
              </LaddaButton>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.extra.buttonSix" />} subtitle={<IntlMessages id="forms.extra.contract" />}>
            <ContentHolder>
              <LaddaButton
                loading={loading}
                onClick={toggle}
                data-color="#eee"
                data-size={XS}
                data-style={CONTRACT}
                data-spinner-size={30}
                data-spinner-color="#fff"
                data-spinner-lines={12}
              >
                <IntlMessages id="forms.extra.clickHere" />
              </LaddaButton>
            </ContentHolder>
          </Box>
        </Col>
      </Row>
    </LayoutWrapper>
  );
}
