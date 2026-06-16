import React, { useState,useEffect } from 'react';
import { Button, Modal,Form,Input,Select,DatePicker } from 'antd';
import moment from 'moment';
import { useIntl } from "react-intl";
const UpdateModal = ({close, open, data,setData,info,type,jobinfo,setJobInfo,compensation,setcompensationState}) => {
    const intl = useIntl();
    const dateFormat = "DD/MM/YYYY";

    const [form] = Form.useForm();
    const [form_two] = Form.useForm();
    const [form_three] = Form.useForm();
    const {Item } = Form;
  const handleOk = () => {
    close(false);
  };
  const handleCancel = () => {
    close(false);
  };
  const options = [
    {
        label :intl.formatMessage({ id: "jobInformations.options.fullTime" }),
        value : "fullTime"
    },
    {
        label :intl.formatMessage({ id: "jobInformations.options.partTime" }),
        value : "partTime"
    },
    {
        label :intl.formatMessage({ id: "jobInformations.options.hybrid" }),
        value : "hybrid"
    },
  ]
  
  const onFinish = (values)=>{
    setData({...values, date : new Date(values.date).toLocaleDateString()});
    form.resetFields();
    close(false);
    info('success',intl.formatMessage({ id: "jobInformations.messages.workStatusUpdated" }));
  }
  
  const onFinishTwo = (values)=>{
    setJobInfo({...values, date : new Date(values.date).toLocaleDateString()});
    form.resetFields();
    close(false);
    info('success',intl.formatMessage({ id: "jobInformations.messages.jobInfoUpdated" }));
  }
  const onFinishThree = (values)=>{
    setcompensationState({...values, date : new Date(values.date).toLocaleDateString()});
    form.resetFields();
    close(false);
    info('success',intl.formatMessage({ id: "jobInformations.messages.compensationUpdated" }));
  }
  useEffect(() => {
    form.setFieldsValue({...data,date: moment(data.date, dateFormat)});
    form_two.setFieldsValue({...jobinfo,date: moment(jobinfo.date, dateFormat)});
    form_three.setFieldsValue({...compensation,date: moment(jobinfo.date, dateFormat)});
  }, [data,jobinfo]);
  return (
    <>
    {
        type === "jobstate" && (
<Modal  title={intl.formatMessage({ id: "jobInformations.workStatus.title" })} open={open} onOk={()=>form.submit()} onCancel={handleCancel}>

<Form  form={form} onFinish={onFinish} layout='vertical' initialValues={data} name={"initialData" }>
<Item label={intl.formatMessage({ id: "jobInformations.workStatus.status" })} name={"state"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.workStatusRequired" })}]}>
    <Select options={options} />
</Item>
<Item  label={intl.formatMessage({ id: "jobInformations.common.effectiveDate" })} name={"date"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.workStatusRequired" })}]}>
             <DatePicker format={dateFormat} size="middle" allowClear={false} />
</Item>
<Item  label={intl.formatMessage({ id: "jobInformations.common.comment" })} name={"comment"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.commentRequired" })}]}>
    <Input.TextArea options={options} />
</Item>
</Form>
</Modal>

        )}

    {
        type === "jobinfo" && (
            <Modal  title={intl.formatMessage({ id: "jobInformations.jobInfo.title" })} open={open} onOk={()=>form_two.submit()} onCancel={handleCancel}>

<Form  form={form_two} onFinish={onFinishTwo} layout='vertical' initialValues={jobinfo} name={"initialData" }>
<Item label={intl.formatMessage({ id: "jobInformations.jobInfo.location" })} name={"location"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.locationRequired" })}]}>
    <Input.TextArea  />
</Item>
<Item  label={intl.formatMessage({ id: "jobInformations.common.effectiveDate" })} name={"date"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.workStatusRequired" })}]}>
             <DatePicker format={dateFormat} size="middle" allowClear={false} />
</Item>
<Item  label={intl.formatMessage({ id: "jobInformations.jobInfo.department" })} name={"blom"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.departmentRequired" })}]}>
    <Input.TextArea />
</Item>
<Item  label={intl.formatMessage({ id: "jobInformations.jobInfo.titleLabel" })} name={"unvani"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.titleRequired" })}]}>
    <Input.TextArea  />
</Item>
<Item  label={intl.formatMessage({ id: "jobInformations.jobInfo.reportsTo" })} name={"rapor"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.reportsToRequired" })}]}>
    <Input.TextArea  />
</Item>
</Form>
</Modal>
        )
    }
    {
        type === 'compensation' && (
            <Modal  title={intl.formatMessage({ id: "jobInformations.compensation.title" })} open={open} onOk={()=>form_three.submit()} onCancel={handleCancel}>

            <Form  form={form_three} onFinish={onFinishThree} layout='vertical' initialValues={compensation} name={"initialData" }>
             <Item label={intl.formatMessage({ id: "jobInformations.compensation.paymentPlan" })} name={"salary"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.paymentPlanRequired" })}]}>
             <Input.TextArea  />
            </Item> 
            <Item  label={intl.formatMessage({ id: "jobInformations.common.effectiveDate" })} name={"date"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.workStatusRequired" })}]}>
                         <DatePicker format={dateFormat} size="middle" allowClear={false} />
            </Item>
            <Item  label={intl.formatMessage({ id: "jobInformations.compensation.paymentType" })} name={"turu"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.paymentTypeRequired" })}]}>
                <Input.TextArea  />
            </Item>
            <Item  label={intl.formatMessage({ id: "jobInformations.compensation.paymentRate" })} name={"oran"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.paymentRateRequired" })}]}>
                <Input.TextArea  />
            </Item>
            <Item  label={intl.formatMessage({ id: "jobInformations.compensation.overtime" })} name={"masai"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.overtimeRequired" })}]}>
                <Input.TextArea  />
            </Item>
            <Item  label={intl.formatMessage({ id: "jobInformations.compensation.overtimePay" })} name={"daha"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.overtimePayRequired" })}]}>
                <Input.TextArea  />
            </Item>
            <Item  label={intl.formatMessage({ id: "jobInformations.compensation.changeReason" })} name={"change"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.changeReasonRequired" })}]}>
                <Input.TextArea  />
            </Item>
            <Item  label={intl.formatMessage({ id: "jobInformations.common.comment" })} name={"comment"} rules={[{required:true, message: intl.formatMessage({ id: "jobInformations.validation.commentRequired" })}]}>
                <Input.TextArea  />
            </Item>
            </Form>
            </Modal>
        )
    }
    </>
  );
};
export default UpdateModal;