import React from "react";
import { Input, Form } from "antd";

// TR ile başlayan ve toplamda 26 haneli olacak şekilde regex
// Bu regex sadece "TR" ile başlayan ve toplamda 26 haneli bir IBAN'ı kabul eder.
const IBAN_REGEX = /^TR\d{24}$/;

const IbanInput = ({ label = "IBAN No", name = "ibanNo", rules = [] }) => {
  return (
    <Form.Item
      label={label}
      name={name}
      rules={[
        { required: true, message: "IBAN gereklidir!" },
        {
          pattern: IBAN_REGEX,
          message:
            "Geçersiz IBAN. Lütfen geçerli bir TR IBAN giriniz.",
        },
        {
          len: 26,
          message: "IBAN 26 haneli olmalıdır.",
        },
        ...rules, // Ekstra kurallar varsa, burada devreye girer
      ]}
    >
      <Input maxLength={26} />
    </Form.Item>
  );
};

export default IbanInput;
