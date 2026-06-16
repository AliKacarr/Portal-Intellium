import React from 'react'
import LayoutWrapper from '@iso/components/utility/layoutWrapper.js';
import ContentHolder from '@iso/components/utility/contentHolder';
import { Col, Row,Button } from 'antd';
import Input, {
    InputGroup,
  } from '@iso/components/uielements/input';
  import Box from '@iso/components/utility/box';
export default function SecondAccount() {
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
    <Row style={rowStyle} gutter={gutter} justify="start">
<Col md={24} sm={24} xs={24} style={colStyle}>
  <Box
    title={"Customer Second Account"}
  >
    <ContentHolder>
      <InputGroup compact style={{ marginBottom: '15px' }}>
        <label style={{ width: '20%' }}>Name</label>
        <Input style={{ width: '30%' }} placeholder="Enter Name" type="text" />
      </InputGroup>
      <InputGroup compact style={{ marginBottom: '15px' }}>
        <label style={{ width: '20%' }}>Email</label>
        <Input style={{ width: '30%' }} placeholder="Enter Email" type="text" />
      </InputGroup>
      <InputGroup compact style={{ marginBottom: '15px' }}>
        <label style={{ width: '20%' }}>Password</label>
        <Input style={{ width: '30%' }} placeholder="Enter Password" type="text"/>
      </InputGroup>
      <InputGroup compact style={{ marginBottom: '15px' }}>
        <label style={{ width: '20%' }}>Company ID</label>
        <Input style={{ width: '30%' }} placeholder="Enter Company ID" type="text"/>
      </InputGroup>
      <Button style={{color:"blue"}}>
        ADD
      </Button>
      </ContentHolder>
  </Box>
</Col>
</Row>
</LayoutWrapper>
  )
}
