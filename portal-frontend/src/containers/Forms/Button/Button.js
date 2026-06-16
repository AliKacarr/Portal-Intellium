import React from 'react';
import {
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  PoweroffOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Row, Col, Button } from 'antd';
import { ButtonGroup } from '@iso/components/uielements/button';
import { RadioGroup, RadioButton } from '@iso/components/uielements/radio';
import Dropdown from '@iso/components/uielements/dropdown';
import PageHeader from '@iso/components/utility/pageHeader';
import Box from '@iso/components/utility/box';
import LayoutWrapper from '@iso/components/utility/layoutWrapper.js';
import ContentHolder from '@iso/components/utility/contentHolder';
import IntlMessages from '@iso/components/utility/intlMessages';
import basicStyle from '@iso/assets/styles/constants';
import { direction } from '@iso/lib/helpers/rtl';
import { useIntl } from 'react-intl';
function handleMenuClick(e) {}

export default function () {
  const intl = useIntl();
  const [size, setSize] = React.useState('large');
  const [loading, setLoading] = React.useState(false);
  const [iconLoading, setIconLoading] = React.useState(false);
  const menuItems = [
    { key: "1", label: intl.formatMessage({ id: "forms.extra.menuItemOne" }) },
    { key: "2", label: intl.formatMessage({ id: "forms.extra.menuItemTwo" }) },
    { key: "3", label: intl.formatMessage({ id: "forms.extra.menuItemThree" }) },
  ];

  const handleSizeChange = (e) => {
    setSize(e.target.value);
  };

  const enterLoading = () => {
    setLoading(true);
  };

  const enterIconLoading = () => {
    setIconLoading(true);
  };

  const margin = {
    margin: direction === 'rtl' ? '0 0 8px 8px' : '0 8px 8px 0',
  };
  const { rowStyle, colStyle, gutter } = basicStyle;
  return (
    <LayoutWrapper>
      <PageHeader>{<IntlMessages id="forms.button.header" />}</PageHeader>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.simpleButton" />}>
            <ContentHolder>
              <Button type="primary" style={margin}>
                {<IntlMessages id="forms.button.simpleButtonPrimaryText" />}
              </Button>
              <Button style={margin}>
                {<IntlMessages id="forms.button.simpleButtonDefaultText" />}
              </Button>
              <Button type="dashed" style={margin}>
                {<IntlMessages id="forms.button.simpleButtonDashedText" />}
              </Button>
              <Button danger>
                {<IntlMessages id="forms.button.simpleButtonDangerText" />}
              </Button>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.iconButton" />}>
            <ContentHolder>
              <Button
                type="primary"
                shape="circle"
                icon={<SearchOutlined />}
                style={margin}
              />
              <Button type="primary" icon={<SearchOutlined />} style={margin}>
                {<IntlMessages id="forms.button.iconPrimaryButton" />}
              </Button>
              <Button shape="circle" icon={<SearchOutlined />} style={margin} />
              <Button icon={<SearchOutlined />}>
                {<IntlMessages id="forms.button.iconSimpleButton" />}
              </Button>
            </ContentHolder>

            <ContentHolder>
              <Button shape="circle" icon={<SearchOutlined />} style={margin} />
              <Button icon={<SearchOutlined />} style={margin}>
                {<IntlMessages id="forms.button.iconCirculerButton" />}
              </Button>
              <Button
                type="dashed"
                shape="circle"
                icon={<SearchOutlined />}
                style={margin}
              />
              <Button type="dashed" icon={<SearchOutlined />}>
                {<IntlMessages id="forms.button.iconDashedButton" />}
              </Button>
            </ContentHolder>
          </Box>
        </Col>
      </Row>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.SizedButton" />}>
            <ContentHolder>
              <RadioGroup value={size} onChange={handleSizeChange}>
                <RadioButton value="large"><IntlMessages id="forms.extra.large" /></RadioButton>
                <RadioButton value="middle"><IntlMessages id="forms.extra.default" /></RadioButton>
                <RadioButton value="small"><IntlMessages id="forms.extra.small" /></RadioButton>
              </RadioGroup>
            </ContentHolder>

            <ContentHolder>
              <Button
                type="primary"
                shape="circle"
                icon={<DownloadOutlined />}
                size={size}
                style={margin}
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size={size}
                style={margin}
              >
                <IntlMessages id="forms.extra.download" />
              </Button>
              <Button type="primary" size={size}>
                <IntlMessages id="forms.extra.normal" />
              </Button>
            </ContentHolder>

            <ContentHolder>
              <ButtonGroup size={size}>
                <Button type="primary">
                  <LeftOutlined />
                  <IntlMessages id="forms.extra.backward" />
                </Button>
                <Button type="primary">
                  <IntlMessages id="forms.extra.forward" />
                  <RightOutlined />
                </Button>
              </ButtonGroup>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.DisabledButton" />}>
            <ContentHolder>
              <Button type="primary" style={margin}>
                <IntlMessages id="forms.extra.primary" />
              </Button>
              <Button type="primary" disabled>
                <IntlMessages id="forms.extra.primaryDisabled" />
              </Button>
            </ContentHolder>

            <ContentHolder>
              <Button style={margin}><IntlMessages id="forms.extra.default" /></Button>
              <Button disabled><IntlMessages id="forms.extra.defaultDisabled" /></Button>
            </ContentHolder>

            <ContentHolder>
              <Button style={margin}><IntlMessages id="forms.extra.ghost" /></Button>
              <Button disabled><IntlMessages id="forms.extra.ghostDisabled" /></Button>
            </ContentHolder>

            <ContentHolder>
              <Button type="dashed" style={margin}>
                <IntlMessages id="forms.extra.dashed" />
              </Button>
              <Button type="dashed" disabled>
                <IntlMessages id="forms.extra.dashedDisabled" />
              </Button>
            </ContentHolder>
          </Box>
        </Col>
      </Row>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.LoadingButton" />}>
            <ContentHolder>
              <Button type="primary" loading style={margin}>
                <IntlMessages id="forms.extra.loading" />
              </Button>
              <Button type="primary" size="small" loading>
                <IntlMessages id="forms.extra.loading" />
              </Button>
            </ContentHolder>

            <ContentHolder>
              <Button
                type="primary"
                loading={loading}
                onClick={enterLoading}
                style={margin}
              >
                <IntlMessages id="forms.extra.clickMe" />
              </Button>
              <Button
                type="primary"
                icon={<PoweroffOutlined />}
                loading={iconLoading}
                onClick={enterIconLoading}
              >
                <IntlMessages id="forms.extra.clickMe" />
              </Button>
            </ContentHolder>

            <ContentHolder>
              <Button shape="circle" loading style={margin} />
              <Button type="primary" shape="circle" loading />
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.MultipleButton" />}>
            <ContentHolder>
              <Button type="primary" style={margin}>
                <IntlMessages id="forms.extra.primaryLower" />
              </Button>
              <Button style={margin}><IntlMessages id="forms.extra.secondary" /></Button>
              <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }}>
                <Button>
                  <IntlMessages id="forms.extra.more" /> <DownOutlined />
                </Button>
              </Dropdown>
            </ContentHolder>
          </Box>
        </Col>
      </Row>
      {/* <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box title={<IntlMessages id="forms.button.groupButton" />}>
            <ContentHolder>
              <h4>Basic</h4>
              <ButtonGroup style={margin}>
                <Button>Cancel</Button>
                <Button type="primary">OK</Button>
              </ButtonGroup>
              <ButtonGroup style={margin}>
                <Button disabled>L</Button>
                <Button disabled>M</Button>
                <Button disabled>R</Button>
              </ButtonGroup>
              <ButtonGroup style={margin}>
                <Button type="primary">L</Button>
                <Button>M</Button>
                <Button>M</Button>
                <Button type="dashed">R</Button>
              </ButtonGroup>
            </ContentHolder>

            <ContentHolder>
              <h4>With Icon</h4>
              <ButtonGroup style={margin}>
                <Button type="primary">
                  <LeftOutlined />
                  Go back
                </Button>
                <Button type="primary">
                  Go forward
                  <RightOutlined />
                </Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button type="primary" icon={<CloudOutlined />} />
                <Button type="primary" icon={<CloudDownloadOutlined />} />
              </ButtonGroup>
            </ContentHolder>
          </Box>
        </Col>
      </Row> */}
    </LayoutWrapper>
  );
}
