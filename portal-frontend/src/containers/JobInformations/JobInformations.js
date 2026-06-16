import React,{useState} from 'react'
import './JobInformations.styles';
import Wrapper from './JobInformations.styles';
import { StarOutlined, StarFilled, StarTwoTone,EditOutlined,PlusCircleOutlined } from '@ant-design/icons';
//ant design
import { Row, Col, Typography,message,Breadcrumb, Descriptions,Button,Space,Divider } from "antd";
// ==== ant design ====
import UpdateModal from './components/UpdateModal';
import BreadLinks from './components/BreadLinks';
import 'antd/dist/antd.css';
import { useIntl } from "react-intl";

const JobInformations = () => {
  const intl = useIntl();
  const {Paragraph, Text, Title } = Typography;
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalType,setModalType] = useState("");

  const [items, setItems] = useState([
    { id: 1, text: intl.formatMessage({ id: "jobInformations.items.item1" }) },
    { id: 2, text: intl.formatMessage({ id: "jobInformations.items.item2" }) },
    { id: 3, text: intl.formatMessage({ id: "jobInformations.items.item3" }) }
  ]);
  const [jobState, setJobState] = useState({
    date : new Date("2023-12-01").toLocaleDateString(),
    state : "fullTime",
    comment : intl.formatMessage({ id: "jobInformations.defaults.workStatusComment" })
  })
  const [jobinfo, setjobinfoState] = useState({
    date : new Date("2023-12-01").toLocaleDateString(),
    location : intl.formatMessage({ id: "jobInformations.defaults.location" }),
    blom : intl.formatMessage({ id: "jobInformations.defaults.department" }),
    unvani : intl.formatMessage({ id: "jobInformations.defaults.jobTitle" }),
    rapor : intl.formatMessage({ id: "jobInformations.defaults.reportsTo" })
  })
  const [compensation, setcompensationState] = useState({
    date : new Date("2023-12-01").toLocaleDateString(),
    salary: intl.formatMessage({ id: "jobInformations.defaults.paymentPlan" }),
    turu : intl.formatMessage({ id: "jobInformations.defaults.paymentType" }),
    oran : intl.formatMessage({ id: "jobInformations.defaults.paymentRate" }),
    masai : intl.formatMessage({ id: "jobInformations.defaults.exempt" }),
    daha : intl.formatMessage({ id: "jobInformations.defaults.exempt" }),
    change : intl.formatMessage({ id: "jobInformations.defaults.changeReason" }),
    comment : intl.formatMessage({ id: "jobInformations.defaults.compensationComment" })
  })

  const handleModalOpen = (type)=>{
    setModalType(type);
    setUpdateModalOpen(true);
  }
  const [newItemText, setNewItemText] = useState('');
  const [editedItemId, setEditedItemId] = useState(null);
  const [editedItemText, setEditedItemText] = useState('');
  const handleInputChange = event => {
    setNewItemText(event.target.value);
  };

  const handleEditInputChange = event => {
    setEditedItemText(event.target.value);
  };

  const addItem = () => {
    if (newItemText.trim() !== '') {
      const newItem = { id: Date.now(), text: newItemText };
      setItems([...items, newItem]);
      setNewItemText('');
    }
  };

  const deleteItem = id => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
  };

  const editItem = id => {
    const itemToEdit = items.find(item => item.id === id);
    if (itemToEdit) {
      setEditedItemId(id);
      setEditedItemText(itemToEdit.text);
    }
  };

  const saveEditedItem = () => {
    const updatedItems = items.map(item =>
      item.id === editedItemId ? { ...item, text: editedItemText } : item
    );
    setItems(updatedItems);
    setEditedItemId(null);
    setEditedItemText('');
  };
  const [messageApi, contextHolder] = message.useMessage();
  const info = (type,content) => {
    messageApi.open({
      type,
      content,
      duration: 10,
    });
  };
    
  return (
  
    <Wrapper>
      {contextHolder}
      <div className='job-header'>
      <BreadLinks/>
     <Title level={3}>
     {intl.formatMessage({ id: "jobInformations.pageTitle" })}
     </Title>
      </div>
      <Divider/>
     <Space style={{width : "100%"}} size={32} direction='vertical'>
     <Descriptions bordered title={(
      <div className='des-header'>
      <Title level={4}>{intl.formatMessage({ id: "jobInformations.workStatus.title" })}</Title>
      <div className='job-header'>
      <Button onClick={()=>handleModalOpen("jobstate")} type={"dashed"} icon={<EditOutlined />}>{intl.formatMessage({ id: "jobInformations.common.update" })}</Button>
      </div>
      </div>
     )} layout="vertical" column={3}>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.common.effectiveDate" })} >
        {jobState.date}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.workStatus.status" })} >
        {intl.formatMessage({ id: `jobInformations.options.${jobState.state}` })}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.common.comment" })} >
        {jobState.comment}
        </Descriptions.Item>
     </Descriptions>

     <Descriptions  bordered title={(
      <div className='des-header'>
     <Title level={4}>{intl.formatMessage({ id: "jobInformations.jobInfo.title" })}</Title>
      <Button onClick={()=>handleModalOpen("jobinfo")}  type={"dashed"} icon={<EditOutlined />}>{intl.formatMessage({ id: "jobInformations.common.update" })}</Button>
      </div>
      
     )} layout="vertical" column={5}>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.common.effectiveDate" })} >
        {jobinfo.date}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.jobInfo.location" })} >
        {jobinfo.location}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.jobInfo.department" })} >
        {jobinfo.blom}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.jobInfo.titleLabel" })} >
        {jobinfo.unvani}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "jobInformations.jobInfo.reportsTo" })} >
        {jobinfo.rapor}
        </Descriptions.Item>
     </Descriptions>


     <Descriptions bordered  title={(
      <div className='des-header'>
     <Title level={4}>{intl.formatMessage({ id: "jobInformations.compensation.title" })}</Title>
      <Button onClick={()=>handleModalOpen("compensation")}  type={"dashed"} icon={<EditOutlined />}>{intl.formatMessage({ id: "jobInformations.common.update" })}</Button>
      </div>
     )} layout="vertical" column={8}>
        <Descriptions.Item  label={intl.formatMessage({ id: "jobInformations.common.effectiveDate" })} >
        {compensation.date} 
        </Descriptions.Item>
        <Descriptions.Item  label={intl.formatMessage({ id: "jobInformations.compensation.paymentPlan" })} >
        {compensation.salary}
        </Descriptions.Item>
        <Descriptions.Item   label={intl.formatMessage({ id: "jobInformations.compensation.paymentType" })} >
        {compensation.turu}
        </Descriptions.Item>
        <Descriptions.Item   label={intl.formatMessage({ id: "jobInformations.compensation.paymentRate" })} >
        {compensation.oran}
        </Descriptions.Item>
        <Descriptions.Item  label={intl.formatMessage({ id: "jobInformations.compensation.overtime" })} >
        {compensation.masai}
        </Descriptions.Item>
        <Descriptions.Item   label={intl.formatMessage({ id: "jobInformations.compensation.overtimePay" })}  >
        {compensation.daha}
        </Descriptions.Item>
        <Descriptions.Item   label={intl.formatMessage({ id: "jobInformations.compensation.changeReason" })} >
        {compensation.change}
        </Descriptions.Item>
        <Descriptions.Item    label={intl.formatMessage({ id: "jobInformations.common.comment" })} >
        {compensation.comment}    
        </Descriptions.Item>
      </Descriptions>
     </Space>

     <UpdateModal compensation={compensation} setcompensationState={setcompensationState} jobinfo={jobinfo} setJobInfo={setjobinfoState} type={modalType} info={info} setData={setJobState} data={jobState} open={updateModalOpen} close={setUpdateModalOpen}/>
    </Wrapper> 
  
  )
  

}

export default JobInformations