import React, { useState } from "react";
import InputNumber from "@iso/components/uielements/InputNumber";

export default function MyComponent() {
  // Durum (state) oluşturuldu
  const [value, setValue] = useState(3); // Başlangıç değeri 3

  // Değişiklik durumunu güncelleyen fonksiyon
  const onChange = (newValue) => {
    setValue(newValue); // Durumu güncelle
  };

  return (
    <InputNumber
      min={1}
      max={10}
      value={value} //  yerine value kullanıldı
      onChange={onChange}
    />
  );
}
