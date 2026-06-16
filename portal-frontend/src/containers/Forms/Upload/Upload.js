import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import Modal from '@iso/components/Feedback/Modal';
import Upload from '@iso/components/uielements/upload';
import PageHeader from '@iso/components/utility/pageHeader';
import Box from '@iso/components/utility/box';
import LayoutWrapper from '@iso/components/utility/layoutWrapper';
import ContentHolder from '@iso/components/utility/contentHolder';
import IntlMessages from '@iso/components/utility/intlMessages';

export default function () {
  const [state, setState] = React.useState({
    previewVisible: false,
    previewImage: '',
    fileList: [
      {
        uid: -1,
        name: 'xxx.png',
        status: 'done',
        url:
          'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
      },
    ],
  });

  const handleCancel = () => setState({ previewVisible: false });

  const handlePreview = (file) => {
    setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  const handleChange = ({ fileList }) => setState({ fileList });

  const { previewVisible, previewImage, fileList } = state;
  const uploadButton = (
    <div className="isoUploadBtn">
      <PlusOutlined />
      <span className="isoUploadText"><IntlMessages id="forms.extra.upload" /></span>
    </div>
  );
  return (
    <LayoutWrapper>
      <PageHeader><IntlMessages id="forms.extra.upload" /></PageHeader>

      <Box
        title={<IntlMessages id="forms.extra.search" />}
        subtitle={<IntlMessages id="forms.extra.upload.subtitle" />}
      >
        <ContentHolder>
          <Upload
            action="//jsonplaceholder.typicode.com/posts/"
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
          >
            {fileList.length >= 3 ? null : uploadButton}
          </Upload>
          <Modal visible={previewVisible} footer={null} onCancel={handleCancel}>
            <img alt="example" style={{ width: '100%' }} src={previewImage} />
          </Modal>
        </ContentHolder>
      </Box>
    </LayoutWrapper>
  );
}
