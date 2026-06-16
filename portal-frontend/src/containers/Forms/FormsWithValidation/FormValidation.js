import React from 'react';
import { Form, Input, Checkbox, Button } from 'antd';
import { useIntl } from 'react-intl';

const formItemLayout = {
  labelCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 8,
    },
  },
  wrapperCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 16,
    },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

const RegistrationForm = () => {
  const intl = useIntl();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Received values of form: ', values);
  };

  return (
    <Form
      {...formItemLayout}
      form={form}
      name="register"
      onFinish={onFinish}
      initialValues={{
        residence: ['zhejiang', 'hangzhou', 'xihu'],
        prefix: '86',
      }}
      scrollToFirstError
    >
      <Form.Item
        name="email"
        label={intl.formatMessage({ id: 'forms.extra.email' })}
        rules={[
          {
            type: 'email',
            message: intl.formatMessage({ id: 'forms.extra.emailInvalid' }),
          },
          {
            required: true,
            message: intl.formatMessage({ id: 'forms.extra.emailRequired' }),
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="password"
        label={intl.formatMessage({ id: 'forms.extra.password' })}
        rules={[
          {
            required: true,
            message: intl.formatMessage({ id: 'forms.extra.passwordRequired' }),
          },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirm"
        label={intl.formatMessage({ id: 'forms.extra.confirmPassword' })}
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: intl.formatMessage({ id: 'forms.extra.confirmPasswordRequired' }),
          },
          ({ getFieldValue }) => ({
            validator(rule, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }

              return Promise.reject(
                intl.formatMessage({ id: 'forms.extra.passwordMismatch' })
              );
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="agreement"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) =>
              value
                ? Promise.resolve()
                : Promise.reject(intl.formatMessage({ id: 'forms.extra.agreementRequired' })),
          },
        ]}
        {...tailFormItemLayout}
      >
        <Checkbox>
          {intl.formatMessage({ id: 'forms.extra.readAgreementPrefix' })} <a href="/">{intl.formatMessage({ id: 'forms.extra.agreement' })}</a>
        </Checkbox>
      </Form.Item>
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          {intl.formatMessage({ id: 'forms.extra.register' })}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegistrationForm;
