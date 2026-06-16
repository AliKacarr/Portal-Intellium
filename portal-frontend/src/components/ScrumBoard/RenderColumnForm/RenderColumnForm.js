import React from 'react';
import { Button, Spin } from 'antd';
import { useIntl } from 'react-intl';
import { AntInput } from '../AntFields';
import { Form, Field } from 'formik';
import HeadingWithIcon from '../HeadingWithIcon/HeadingWithIcon';
import FolderIcon from './05-icon.svg';
import RenderColumnWrapper from './RenderColumnForm.style';

const RenderColumnForm = props => {
  const intl = useIntl();
  const { handleSubmit, onCancel, submitCount, values, apiProgress } = props;

  const required = (value) => (!value ? intl.formatMessage({ id: 'scrumboard.validation.required' }) : '');

  return (
    <RenderColumnWrapper className="render-form-wrapper">
      <HeadingWithIcon
        iconSrc={FolderIcon}
        heading={intl.formatMessage({ id: 'scrumboard.columnForm.heading' })}
        size={'20px'}
      />

      <Form onSubmit={handleSubmit}>
        <Field
          component={AntInput}
          name="name"
          type="text"
          defaultValue={values.name}
          placeholder={intl.formatMessage({ id: 'scrumboard.columnForm.placeholder' })}
          validate={required}
          submitCount={submitCount}
          hasFeedback
          size="large"
          formitem={{
            colon: false,
          }}
        />
        {apiProgress ? <Spin /> :
          <>
            <Button type="default" onClick={onCancel} size="large">
              {intl.formatMessage({ id: 'scrumboard.columnForm.cancel' })}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginLeft: 10 }}
              size="large"
            >
              {props.initials && props.initials.editing
                ? intl.formatMessage({ id: 'scrumboard.columnForm.update' })
                : intl.formatMessage({ id: 'scrumboard.columnForm.save' })}
            </Button>
          </>
        }
      </Form>
    </RenderColumnWrapper>
  );
};

export default RenderColumnForm;
