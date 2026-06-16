import language from "@iso/config/language.config";
import englishLang from "@iso/assets/images/flag/uk.svg";
import turkishLang from "@iso/assets/images/flag/italy.svg";
const config = {
  defaultLanguage: language,
  options: [
    {
      languageId: "turkish",
      locale: "tr",
      text: "Türkçe",
      icon: turkishLang,
    },
    {
      languageId: "english",
      locale: "en",
      text: "English",
      icon: englishLang,
    },
  ],
};

export function getCurrentLanguage(lang) {
  let selecetedLanguage = config.options[0];
  config.options.forEach((language) => {
    if (language.languageId === lang) {
      selecetedLanguage = language;
    }
  });
  return selecetedLanguage;
}
export default config;
