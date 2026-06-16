import { themeConfig } from "@iso/config/theme/theme.config";
const changeThemes = {
  id: "changeThemes",
  label: "themeSwitcher",
  defaultTheme: themeConfig.theme,
  options: [
    {
      themeName: "defaultTheme",
      buttonColor: "#ffffff",
      textColor: "#323332",
    },
    {
      themeName: "theme2",
      buttonColor: "#ffffff",
      textColor: "#323332",
    },
  ],
};
const topbarTheme = {
  id: "topbarTheme",
  label: "themeSwitcher.Topbar",
  defaultTheme: themeConfig.topbar,
  options: [
    {
      themeName: "defaultTheme",
      buttonColor: "#ffffff",
      textColor: "#323332",
    },

    {
      themeName: "theme6",
      buttonColor: "#4670a2",
      backgroundColor: "#4670a2",
      textColor: "#ffffff",
    },
  ],
};
const sidebarTheme = {
  id: "sidebarTheme",
  label: "themeSwitcher.Sidebar",
  defaultTheme: themeConfig.sidebar,
  options: [
    {
      themeName: "defaultTheme",
      buttonColor: "#323332",
      backgroundColor: undefined,
      textColor: "#788195",
    },

    {
      themeName: "theme6",
      buttonColor: "#4670a2",
      backgroundColor: "#4670a2",
      textColor: "#ffffff",
    },
  ],
};
const layoutTheme = {
  id: "layoutTheme",
  label: "themeSwitcher.Background",
  defaultTheme: themeConfig.layout,
  options: [
    {
      themeName: "defaultTheme",
      buttonColor: "#ffffff",
      backgroundColor: "#F1F3F6",
      textColor: undefined,
    },

    {
      themeName: "theme2",
      buttonColor: "#F9F9F9",
      backgroundColor: "#F9F9F9",
      textColor: "#ffffff",
    },
  ],
};
const customizedThemes = {
  changeThemes,
  topbarTheme,
  sidebarTheme,
  layoutTheme,
};
export function getCurrentTheme(attribute, selectedThemename) {
  let selecetedTheme = {};
  customizedThemes[attribute].options.forEach((theme) => {
    if (theme.themeName === selectedThemename) {
      selecetedTheme = theme;
    }
  });
  return selecetedTheme;
}
export default customizedThemes;
