import React from 'react';
import { Row, Col } from 'antd';
import Radio, { RadioGroup } from '@iso/components/uielements/radio';
import Input from '@iso/components/uielements/input';
import PageHeader from '@iso/components/utility/pageHeader';
import Box from '@iso/components/utility/box';
import LayoutWrapper from '@iso/components/utility/layoutWrapper.js';
import ContentHolder from '@iso/components/utility/contentHolder';
import IntlMessages from '@iso/components/utility/intlMessages';
import basicStyle from '@iso/assets/styles/constants';
import { direction } from '@iso/lib/helpers/rtl';
import { useIntl } from 'react-intl';

export default function() {
  const intl = useIntl();
  const plainOptions = [
    intl.formatMessage({ id: 'forms.extra.apple' }),
    intl.formatMessage({ id: 'forms.extra.pear' }),
    intl.formatMessage({ id: 'forms.extra.orange' }),
  ];
  const options = [
    { label: intl.formatMessage({ id: 'forms.extra.apple' }), value: 'Apple' },
    { label: intl.formatMessage({ id: 'forms.extra.pear' }), value: 'Pear' },
    { label: intl.formatMessage({ id: 'forms.extra.orange' }), value: 'Orange' },
  ];
  const optionsWithDisabled = [
    { label: intl.formatMessage({ id: 'forms.extra.apple' }), value: 'Apple' },
    { label: intl.formatMessage({ id: 'forms.extra.pear' }), value: 'Pear' },
    { label: intl.formatMessage({ id: 'forms.extra.orange' }), value: 'Orange', disabled: false },
  ];
  const [state, setState] = React.useState({
    value: 1,
    value1: 'Apple',
    value2: 'Apple',
    value3: 'Apple',
    value4: 11,
  });
  const onChange = e => {
    const { name, value } = e.target;
    setState({
      ...state,
      [name]: value,
    });
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };
  const { rowStyle, colStyle, gutter } = basicStyle;
  return (
    <LayoutWrapper>
      <PageHeader>{<IntlMessages id="forms.radio.header" />}</PageHeader>
      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box
            title={<IntlMessages id="forms.radio.simpleTitle" />}
            subtitle={<IntlMessages id="forms.radio.simpleSubTitle" />}
          >
            <ContentHolder>
              <Radio><IntlMessages id="forms.extra.radio" /></Radio>
              <br />
              <Radio defaultChecked={false} disabled>
                <IntlMessages id="forms.extra.disabled" />
              </Radio>
              <br />
              <Radio defaultChecked disabled>
                <IntlMessages id="forms.extra.disabled" />
              </Radio>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box
            title={<IntlMessages id="forms.radio.groupTitle" />}
            subtitle={<IntlMessages id="forms.radio.groupSubTitle" />}
          >
            <ContentHolder>
              <RadioGroup onChange={onChange} name="value" value={state.value}>
                <Radio style={radioStyle} value={1}>
                  <IntlMessages id="forms.extra.optionA" />
                </Radio>
                <Radio style={radioStyle} value={2}>
                  <IntlMessages id="forms.extra.optionB" />
                </Radio>
                <Radio style={radioStyle} value={3}>
                  <IntlMessages id="forms.extra.optionC" />
                </Radio>
                <Radio style={radioStyle} value={4}>
                  <IntlMessages id="forms.extra.moreEllipsis" />
                  {state.value === 4 ? (
                    <Input
                      style={{
                        width: 100,
                        marginLeft: direction === 'rtl' ? 0 : 10,
                        marginRight: direction === 'rtl' ? 10 : 0,
                      }}
                    />
                  ) : null}
                </Radio>
              </RadioGroup>
            </ContentHolder>
          </Box>
        </Col>
      </Row>

      <Row style={rowStyle} gutter={gutter} justify="start">
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box
            title={<IntlMessages id="forms.radio.groupSecondTitle" />}
            subtitle={<IntlMessages id="forms.radio.groupSecondSubTitle" />}
          >
            <ContentHolder>
              <RadioGroup
                onChange={onChange}
                name="value4"
                value={state.value4}
              >
                <Radio value={11}><IntlMessages id="forms.extra.optionAShort" /></Radio>
                <Radio value={22}><IntlMessages id="forms.extra.optionBShort" /></Radio>
                <Radio value={32}><IntlMessages id="forms.extra.optionCShort" /></Radio>
                <Radio value={43}><IntlMessages id="forms.extra.optionDShort" /></Radio>
              </RadioGroup>
            </ContentHolder>
          </Box>
        </Col>
        <Col md={12} sm={12} xs={24} style={colStyle}>
          <Box
            title={<IntlMessages id="forms.radio.groupThirdTitle" />}
            subtitle={<IntlMessages id="forms.radio.groupThirdSubTitle" />}
          >
            <ContentHolder>
              <RadioGroup
                options={plainOptions}
                onChange={onChange}
                name="value1"
                value={state.value1}
                style={{ marginBottom: '10px' }}
              />
              <RadioGroup
                options={options}
                onChange={onChange}
                name="value2"
                value={state.value2}
                style={{ marginBottom: '10px' }}
              />
              <RadioGroup
                options={optionsWithDisabled}
                onChange={onChange}
                name="value3"
                value={state.value3}
              />
            </ContentHolder>
          </Box>
        </Col>
      </Row>
    </LayoutWrapper>
  );
}
