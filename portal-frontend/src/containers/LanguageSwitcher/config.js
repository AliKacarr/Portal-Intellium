import language from "@iso/config/language.config";

import englishLang from "@iso/assets/images/flag/uk.svg";
import turkishLang from "@iso/assets/images/flag/turkey.svg";

const config = {
  defaultLanguage: language,
  options: [
    {
      languageId: "turkish",
      locale: "tr",
      textKey: "languageSwitcher.options.turkish",
      icon: turkishLang,
    },
    {
      languageId: "english",
      locale: "en",
      textKey: "languageSwitcher.options.english",
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
