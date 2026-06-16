import { parsePhoneNumber } from "libphonenumber-js";

const formatTurkeyPhoneNumber = (number) => {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";

  const nationalDigits = digits.startsWith("90") ? digits.slice(2) : digits;
  const withoutLeadingZero = nationalDigits.startsWith("0") ? nationalDigits.slice(1) : nationalDigits;
  const lastTenDigits = withoutLeadingZero.slice(-10);

  if (lastTenDigits.length !== 10) return null;

  return `+90 ${lastTenDigits.slice(0, 3)} ${lastTenDigits.slice(3, 6)} ${lastTenDigits.slice(6, 8)} ${lastTenDigits.slice(8, 10)}`;
};

// Format Phone Number
export const formatPhoneNumber = (number) => {
  const turkeyFormattedNumber = formatTurkeyPhoneNumber(number);
  if (turkeyFormattedNumber !== null) {
    return turkeyFormattedNumber;
  }

  try {
    const formattedNumber = parsePhoneNumber(number)
      .formatInternational()
      .replace(/(\+\d+)\s(\d+)\s(\d+)/, "$1 ($2) $3");

    return formattedNumber;
  } catch (error) {
    return number;
  }
};
