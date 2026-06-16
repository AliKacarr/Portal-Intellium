import React from 'react';
import TreeSelect from '@iso/components/uielements/treeSelect';
import PageHeader from '@iso/components/utility/pageHeader';
import Box from '@iso/components/utility/box';
import LayoutWrapper from '@iso/components/utility/layoutWrapper.js';
import ContentHolder from '@iso/components/utility/contentHolder';
import IntlMessages from '@iso/components/utility/intlMessages';
import { useIntl } from 'react-intl';

const SHOW_PARENT = TreeSelect.SHOW_PARENT;

export default function() {
  const intl = useIntl();
  const treeData = [
    {
      label: intl.formatMessage({ id: 'forms.extra.node1' }),
      value: '0-0',
      key: '0-0',
      children: [
        {
          label: intl.formatMessage({ id: 'forms.extra.childNode1' }),
          value: '0-0-0',
          key: '0-0-0',
        },
      ],
    },
    {
      label: intl.formatMessage({ id: 'forms.extra.node2' }),
      value: '0-1',
      key: '0-1',
      children: [
        {
          label: intl.formatMessage({ id: 'forms.extra.childNode3' }),
          value: '0-1-0',
          key: '0-1-0',
        },
        {
          label: intl.formatMessage({ id: 'forms.extra.childNode4' }),
          value: '0-1-1',
          key: '0-1-1',
        },
        {
          label: intl.formatMessage({ id: 'forms.extra.childNode5' }),
          value: '0-1-2',
          key: '0-1-2',
        },
      ],
    },
  ];
  const [value, setValue] = React.useState(['0-0-0']);

  const onChange = value => {
    setValue(value);
  };
  const tProps = {
    treeData,
    value: value,
    onChange: onChange,
    multiple: true,
    treeCheckable: true,
    showCheckedStrategy: SHOW_PARENT,
    searchPlaceholder: intl.formatMessage({ id: 'forms.extra.pleaseSelect' }),
    style: {
      width: 300,
    },
  };
  return (
    <LayoutWrapper>
      <PageHeader><IntlMessages id="forms.extra.treeSelect" /></PageHeader>
      <Box title={<IntlMessages id="forms.extra.multiple" />} subtitle={<IntlMessages id="forms.extra.multipleCheckable" />}>
        <ContentHolder>
          <TreeSelect {...tProps} />
        </ContentHolder>
      </Box>
    </LayoutWrapper>
  );
}
