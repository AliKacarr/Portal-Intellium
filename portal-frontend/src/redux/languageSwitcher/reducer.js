import config, { getCurrentLanguage } from './config';

import actions from './actions';

const LANGUAGE_STORAGE_KEY = 'language';

const getInitialLanguage = () => {
  const fallbackLanguageId = config.defaultLanguage || 'english';
  if (typeof window === 'undefined') {
    return getCurrentLanguage(fallbackLanguageId);
  }

  const storedLanguageId = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const languageId = storedLanguageId || fallbackLanguageId;
  const initialLanguage = getCurrentLanguage(languageId);

  if (!storedLanguageId) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, initialLanguage.languageId);
  }

  return initialLanguage;
};

const initState = {
  isActivated: false,
  language: getInitialLanguage(),
};

export default function(state = initState, action) {
  switch (action.type) {
    case actions.ACTIVATE_LANG_MODAL:
      return {
        ...state,
        isActivated: !state.isActivated,
      };
    case actions.CHANGE_LANGUAGE:
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          LANGUAGE_STORAGE_KEY,
          action.language.languageId
        );
      }
      return {
        ...state,
        language: action.language,
      };
    default:
      return state;
  }
}
