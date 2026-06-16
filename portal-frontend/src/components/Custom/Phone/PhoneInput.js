import React, { useState } from 'react';
import { Input } from 'antd';

const PhoneInput = (props) => {
  const [formattedValue, setFormattedValue] = useState('');

  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Remove all non-digit characters from the input
    const plainNumber = inputValue.replace(/\D/g, '');

    // Format the plain number using your desired phone number format
    const formattedNumber = formatPhoneNumber(plainNumber);

    setFormattedValue(formattedNumber);

    // Pass the plain number value to the parent component
    props.onChange(plainNumber);
  };

  // Format phone number function (customize this according to your desired format)
  const formatPhoneNumber = (number) => {
    // Format the number as needed (e.g., adding dashes, parentheses)
    // This is just a basic example, you can customize it based on your requirements
    return number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Input
      {...props}
      value={formattedValue}
      onChange={handleChange}
      placeholder="Enter phone number"
    />
  );
};

export default PhoneInput;
