/**
 * Yıl hesaplayan fonksiyon
 * @param {string} DateString - tarih, "YYYY-MM-DD" formatında
 * @returns {number} - Hesaplanan yaş
 */
function calculateYear(DateString) {
  const today = new Date();
  const date = new Date(DateString);

  let years = today.getFullYear() - date.getFullYear();
  let months = today.getMonth() - date.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months };
}

module.exports = calculateYear;
