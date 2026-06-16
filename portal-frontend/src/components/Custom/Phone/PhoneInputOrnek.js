import React, { useState } from 'react';
import PhoneInput from './PhoneInput'; // Assuming PhoneInput.js is in the same directory

const MyForm = () => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Phone Number:</label>
        <PhoneInput onChange={handlePhoneChange} />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default MyForm;
