import styled, { css, keyframes } from "styled-components";
import { palette } from "styled-theme";
import { Button, DatePicker, Divider, Input, Select, Upload } from "antd";

const toneMap = {
  blue: {
    background: "rgba(47, 137, 217, 0.12)",
    color: "#2f89d9",
  },
  amber: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#f59e0b",
  },
  green: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#10b981",
  },
};

const badgeToneMap = {
  positive: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#0f9f6e",
  },
  negative: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
  },
  neutral: {
    background: "rgba(71, 85, 105, 0.12)",
    color: "#475569",
  },
};

const surfaceCard = css`
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(215, 224, 239, 0.9);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
`;

const chartContentEntrance = keyframes`
  0% {
    opacity: 0;
    transform: translateX(18px) scale(0.99);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const Wrapper = styled.div`
  min-height: 100%;
  /* Daha kompakt masraf UI: daha az padding, daha çok içerik */
  padding: 16px;
  background: radial-gradient(
      circle at top left,
      rgba(47, 137, 217, 0.08),
      transparent 28%
    ),
    linear-gradient(180deg, #f7faff 0%, #eef4fb 100%);

  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 12px 14px;
  }

  @media (max-width: 480px) {
    padding: 10px;
  }
`;

export const HeroSection = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;

  @media (max-width: 980px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const HeroControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: nowrap;
  min-width: 0;

  @media (max-width: 980px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.03em;
  color: #0f172a;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

export const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 620px;
  font-size: 13px;
  color: #8a98b5;
  letter-spacing: 0.01em;
`;

export const HeroSearch = styled(Input)`
  && {
    flex: 0 0 220px;
    width: 220px !important;
    min-width: 220px !important;
    height: 40px !important;
    border-radius: 12px !important;
    border: 1px solid rgba(203, 213, 225, 0.95) !important;
    background: rgba(255, 255, 255, 0.96) !important;
    padding-inline: 12px;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05) !important;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .ant-input {
    background: transparent;
    font-size: 13px;
    line-height: 1.2;
  }

  .ant-input-prefix {
    color: #94a3b8;
    margin-right: 8px;
  }

  &:hover,
  &:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.1);
  }

  @media (max-width: 980px) {
    max-width: none;
    width: 100%;
    min-width: 0;
    flex-basis: 100%;
  }
`;

export const HeaderActionButton = styled(Button)`
  && {
    height: 40px !important;
    padding: 0 12px !important;
    min-width: 220px !important;
    width: 220px !important;
    border-radius: 12px !important;
    border: 1px solid rgba(203, 213, 225, 0.95) !important;
    background: rgba(255, 255, 255, 0.96) !important;
    color: #334155;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05) !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    white-space: nowrap;
    flex: 0 0 220px;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
  }

  > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .anticon,
  .ant-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    line-height: 1;
    margin-inline-end: 0;
    transform: translateY(-1px);
  }

  .anticon svg,
  .ant-btn-icon svg {
    display: block;
  }

  &:hover,
  &:focus {
    color: #1d4ed8;
    border-color: #93c5fd;
    background: #ffffff;
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.1);
  }

  @media (max-width: 980px) {
    min-width: 0;
    width: 100%;
    flex-basis: 100%;
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div`
  ${surfaceCard};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 14px;
  padding: 18px;
  min-height: 164px;
`;

export const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
`;

export const StatIcon = styled.div`
  ${({ $tone }) => {
    const tone = toneMap[$tone] || toneMap.blue;
    return css`
      background: ${tone.background};
      color: ${tone.color};
    `;
  }}

  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
`;

export const StatLabel = styled.span`
  display: inline-flex;
  margin-bottom: 6px;
  color: #8fa0bd;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

export const SecondaryStatLabel = styled.div`
  max-width: 220px;
  color: #9aacbf;
  font-size: 12px;
  line-height: 1.35;
`;

export const StatValue = styled.div`
  margin: 14px 0 12px;
  color: #081126;
  /* Büyük rakamlar (örn. 8000) için daha kompakt ölçü */
  font-size: clamp(22px, 2.1vw, 32px);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.035em;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
`;

export const StatFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const TrendBadge = styled.span`
  ${({ $tone }) => {
    const tone = badgeToneMap[$tone] || badgeToneMap.neutral;
    return css`
      background: ${tone.background};
      color: ${tone.color};
    `;
  }}

  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
`;

export const StatMeta = styled.span`
  color: #94a3b8;
  font-size: 13px;
`;

export const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

export const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const SortActionField = styled.div`
  width: 214px;
  min-width: 214px;
  max-width: 214px;

  @media (max-width: 768px) {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }
`;

export const ActionButton = styled(Button)`
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(213, 221, 235, 0.92);
  background: rgba(255, 255, 255, 0.9);
  color: #334667;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .anticon,
  .ant-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    line-height: 1;
    margin-inline-end: 0;
    transform: translateY(-1px);
  }

  .anticon svg,
  .ant-btn-icon svg {
    display: block;
  }

  &:hover,
  &:focus {
    color: #1f5fb8;
    border-color: #cfe0f7;
    background: #ffffff;
  }
`;

export const ToolbarUniformButton = styled(ActionButton)`
  && > span {
    line-height: 1.35;
  }

  && {
    width: 214px !important;
    min-width: 214px !important;
    max-width: 214px !important;
    height: 44px !important;
    border-radius: 12px !important;
    padding: 0 14px !important;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05) !important;
    justify-content: center;
    /* overflow:hidden descender (g, ş, y) keser; yatay taşmayı iç span’da kırpıyoruz */
    overflow: visible;
    line-height: 1.35;
  }

  /* nowrap yalnızca tek satırlı ikon+metin butonlarında; sıralama etiketi 2 satır → scrollbar oluşmasın */
  &&.expense-toolbar-btn--horizontal:not(.expense-sort-trigger)
    > span:not(.ant-btn-icon):not(.anticon) {
    overflow-x: hidden;
    overflow-y: visible;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    line-height: 1.35;
  }

  &&.expense-sort-trigger .expense-sort-trigger__main,
  &&.expense-sort-trigger .expense-sort-trigger__label {
    overflow: visible;
    white-space: normal;
  }

  && .expense-sort-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    line-height: 1.05;
    white-space: normal;
  }

  && .expense-sort-label__top {
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
  }

  && .expense-sort-label__bottom {
    font-weight: 600;
    font-size: 12px;
    color: #64748b;
  }

  && .expense-sort-label--single {
    white-space: nowrap;
    overflow-x: hidden;
    overflow-y: visible;
    text-overflow: ellipsis;
  }

  /* Masraf araç çubuğu: ikon + metin yatay; ikon–yazı boşluğu ikon margin ile (gap ile çiftlenmesin). */
  &&.expense-toolbar-btn--horizontal:not(.expense-sort-trigger) {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: center !important;
    column-gap: 0 !important;
    row-gap: 0 !important;
  }

  &&.expense-toolbar-btn--horizontal.expense-sort-trigger {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    column-gap: 12px !important;
    row-gap: 0 !important;
    height: auto !important;
    min-height: 44px !important;
    padding-top: 6px !important;
    padding-bottom: 6px !important;
  }

  &&.expense-toolbar-btn--horizontal > * {
    flex-direction: row !important;
  }

  /* Doğrudan çocuk ikon (Kategori, Filtre): metinle arayı margin açar */
  &&.expense-toolbar-btn--horizontal:not(.expense-sort-trigger) > .anticon,
  &&.expense-toolbar-btn--horizontal:not(.expense-sort-trigger) .ant-btn-icon {
    margin-inline-end: 12px !important;
    line-height: 1;
    transform: none;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    vertical-align: middle;
  }

  /* Sıralama: boşluk yalnızca __main column-gap ile (çift boşluk olmasın) */
  && .expense-sort-trigger__main > .anticon,
  && .expense-sort-trigger__main .expense-toolbar-btn__inlineIcon {
    margin-inline-end: 0 !important;
    line-height: 1;
    transform: none;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    vertical-align: middle;
  }

  &&.expense-toolbar-btn--horizontal > .anticon svg,
  &&.expense-toolbar-btn--horizontal .expense-toolbar-btn__inlineIcon svg {
    display: block;
  }

  && .expense-sort-trigger__main {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    column-gap: 12px;
    row-gap: 0;
    min-width: 0;
    flex: 1 1 auto;
  }

  && .expense-toolbar-btn__inlineIcon {
    flex: 0 0 auto;
    font-size: 16px;
    color: #2f89d9;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    transform: none;
    vertical-align: middle;
  }

  &&.expense-toolbar-btn--horizontal > span:not(.anticon):not(.ant-btn-icon),
  &&.expense-toolbar-btn--horizontal .expense-sort-trigger__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &&.expense-sort-trigger.expense-toolbar-btn--horizontal .expense-sort-trigger__label {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
  }

  &&.expense-sort-trigger.expense-toolbar-btn--horizontal .expense-sort-trigger__chevron {
    flex: 0 0 auto;
  }

  @media (max-width: 768px) {
    && {
      width: 100% !important;
      min-width: 100% !important;
      max-width: 100% !important;
    }
  }
`;

export const PrimaryActionButton = styled(ActionButton)`
  background: linear-gradient(135deg, #3da0ea 0%, #1f76c7 100%);
  border-color: transparent;
  color: #ffffff;
  min-width: 218px;
  box-shadow: 0 10px 20px rgba(31, 118, 199, 0.2);

  &:hover,
  &:focus {
    color: #ffffff;
    background: linear-gradient(135deg, #46a8f1 0%, #176fbf 100%);
  }
`;

export const InsightRow = styled.div`
  ${surfaceCard};
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    padding: 12px 14px;
  }
`;

export const InsightMeta = styled.div`
  color: #8fa0bd;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

export const InsightValue = styled.div`
  color: #10203e;
  font-size: 16px;
  font-weight: 700;
`;

export const FilterSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
`;

export const FilterTag = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(213, 221, 235, 0.92);
  color: #42567a;
  font-size: 14px;
  font-weight: 600;
`;

export const FiltersPanel = styled.div`
  ${surfaceCard};
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  margin-bottom: 24px;
  align-items: end;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      rgba(247, 250, 255, 0.94)
    ),
    radial-gradient(
      circle at top right,
      rgba(47, 137, 217, 0.08),
      transparent 26%
    );

  > div {
    min-width: 0;
  }

  .filters-panel__field {
    grid-column: span 3;
    min-width: 0;
  }

  .filters-panel__field--date-range {
    grid-column: span 4;
  }

  .filters-panel__field--action {
    grid-column: span 2;
  }

  label {
    margin-bottom: 6px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #6e82a5 !important;
    letter-spacing: 0.01em;
  }

  .ant-select,
  .ant-picker,
  .ant-input-number {
    width: 100%;
  }

  .ant-select-selector,
  .ant-picker,
  .ant-input-number {
    height: 44px !important;
    border-radius: 14px !important;
    border-color: rgba(213, 221, 235, 0.9) !important;
    box-shadow: none !important;
    background: rgba(255, 255, 255, 0.96) !important;
  }

  .ant-select-selector {
    display: flex !important;
    align-items: center !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .ant-select-selection-search,
  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    display: flex !important;
    align-items: center !important;
    height: 42px !important;
    line-height: 42px !important;
    font-size: 13px !important;
  }

  .ant-picker-input > input {
    font-size: 14px;
  }

  .ant-input-number-input {
    height: 42px !important;
    font-size: 14px !important;
  }

  .ant-input-number-handler-wrap {
    display: none !important;
  }

  .ant-input-number,
  .ant-input-number input {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .ant-input-number input::-webkit-outer-spin-button,
  .ant-input-number input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .ant-btn {
    height: 44px;
    min-width: 120px;
    align-self: end;
    border-radius: 14px;
    border-color: rgba(213, 221, 235, 0.92);
    font-weight: 600;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }

  .filters-panel__action {
    display: flex;
    align-items: end;
    justify-content: stretch;
    min-width: 0;
  }

  .filters-panel__action .ant-btn {
    width: 100%;
    min-width: 110px;
  }

  @media (min-width: 1280px) {
    .filters-panel__field {
      grid-column: span 3;
    }
    .filters-panel__field--date-range {
      grid-column: span 4;
    }
    .filters-panel__field--action {
      grid-column: span 2;
    }
  }

  @media (max-width: 1279px) {
    .filters-panel__field {
      grid-column: span 4;
    }
    .filters-panel__field--date-range,
    .filters-panel__field--action {
      grid-column: span 4;
    }
  }

  @media (max-width: 1024px) {
    .filters-panel__field {
      grid-column: span 6;
    }
    .filters-panel__field--date-range {
      grid-column: span 12;
    }
    .filters-panel__action {
      grid-column: span 6;
    }
  }

  @media (max-width: 768px) {
    gap: 12px;
    .filters-panel__field {
      grid-column: span 12;
    }
    .filters-panel__field--date-range,
    .filters-panel__field--action {
      grid-column: span 12;
    }
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    .filters-panel__field,
    .filters-panel__field--date-range,
    .filters-panel__field--action {
      grid-column: span 1;
    }
  }
`;

export const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 0.85fr);
  gap: 20px;
  align-items: start;
  min-width: 0;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const SidePanelStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Panel = styled.div`
  ${surfaceCard};
  border-radius: 16px;
  overflow: hidden;
  min-height: ${({ $shrinkToContent }) => ($shrinkToContent ? "auto" : "100%")};
  min-width: 0;
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 600px) {
    padding: 16px 14px 12px;
  }
`;

export const PanelHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
`;

export const PanelSubtitle = styled.span`
  color: #94a3b8;
  font-size: 12px;
`;

export const PanelMetaAction = styled.button`
  border: 0;
  background: transparent;
  color: #2890ef;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
`;

export const PanelFooterActionRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 20px 22px;

  @media (max-width: 600px) {
    padding: 0 16px 18px;
  }
`;

export const PanelControlGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const PanelControlPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 14px;
  border-radius: 10px;
  background: rgba(47, 137, 217, 0.1);
  color: #1f76c7;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const PanelNavButton = styled.button`
  width: 36px;
  height: 36px;
  min-width: 36px;
  padding: 0;
  appearance: none;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: #60708d;
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;

  .anticon {
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover,
  &:focus {
    color: #1f76c7;
    background: radial-gradient(
      circle,
      rgba(47, 137, 217, 0.14) 0%,
      rgba(47, 137, 217, 0.08) 42%,
      transparent 70%
    );
    box-shadow: none;
    transform: translateY(-1px);
  }

  @media (max-width: 600px) {
    width: 32px;
    height: 32px;
    min-width: 32px;

    .anticon {
      font-size: 13px;
    }
  }
`;

export const ActivityTableScroll = styled.div`
  overflow: visible;
`;

export const ActivityTable = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px 16px 18px;

  @media (max-width: 1320px) {
    padding: 12px;
  }
`;

export const ActivityTableHead = styled.div`
  display: grid;
  grid-template-columns:
    88px minmax(240px, 2.2fr) minmax(110px, 0.9fr) minmax(110px, 0.75fr)
    minmax(130px, 0.9fr) 104px;
  gap: 12px;
  padding: 18px 24px;
  color: #96a5c1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;

  > :nth-child(1) {
    justify-self: center;
  }

  > :nth-child(3),
  > :nth-child(4),
  > :nth-child(5) {
    justify-self: center;
    text-align: center;
  }

  > :nth-child(6) {
    justify-self: end;
    text-align: right;
  }

  @media (max-width: 1320px) {
    display: none;
  }
`;

export const ActivityRow = styled.div`
  ${({ $pinned }) =>
    $pinned
      ? css`
          border-color: rgba(31, 118, 199, 0.34);
          background: linear-gradient(
            180deg,
            rgba(239, 247, 255, 0.98),
            rgba(247, 250, 255, 0.98)
          );
          box-shadow:
            0 16px 34px rgba(31, 118, 199, 0.12),
            inset 4px 0 0 #1f76c7;
        `
      : null}

  display: grid;
  grid-template-columns:
    88px minmax(240px, 2.2fr) minmax(110px, 0.9fr) minmax(110px, 0.75fr)
    minmax(130px, 0.9fr) 104px;
  gap: 12px;
  align-items: center;
  padding: 20px;
  margin-top: 12px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #f8fbff);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: rgba(147, 197, 253, 0.7);
    background: linear-gradient(180deg, #ffffff, #f3f8ff);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.1);
    transform: translateY(-1px);
  }

  &:first-of-type {
    margin-top: 0;
  }

  > :nth-child(1) {
    justify-self: center;
  }

  > :nth-child(3),
  > :nth-child(4),
  > :nth-child(5) {
    justify-self: center;
    text-align: center;
  }

  @media (max-width: 1320px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px 20px;
  }
`;

export const DateCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #60708d;
  text-align: center;
`;

export const DateDay = styled.span`
  font-size: 30px;
  font-weight: 700;
  line-height: 0.9;
  color: #0f172a;
`;

export const DateMonth = styled.span`
  font-size: 17px;
  font-weight: 600;
`;

export const DateYear = styled.span`
  font-size: 15px;
`;

export const DescriptionCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`;

export const DescriptionTitle = styled.span`
  color: #0f172a;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.45;
`;

export const DescriptionMeta = styled.span`
  color: #94a3b8;
  font-size: 14px;
`;

export const DescriptionMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const MetaBadge = styled.span`
  ${({ $tone }) =>
    $tone === "highlight"
      ? css`
          background: rgba(31, 118, 199, 0.12);
          color: #1f76c7;
          border: 1px solid rgba(31, 118, 199, 0.16);
        `
      : null}

  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(241, 245, 249, 0.92);
  color: #51627f;
  font-size: 13px;
  font-weight: 600;
`;

export const CategoryPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  min-height: 30px;
  padding: 6px 14px;
  border-radius: 10px;
  background: ${({ $background }) => $background || "rgba(47, 137, 217, 0.12)"};
  color: ${({ $color }) => $color || "#2f89d9"};
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 14px;
    padding: 5px 12px;
  }
`;

/** Talep içi masraf adedi — kategori pill’leriyle uyumlu modern chip */
export const ExpenseCountChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 5px;
  border-radius: 999px;
  background: linear-gradient(
    155deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(241, 245, 249, 0.88) 100%
  );
  border: 1px solid rgba(203, 213, 225, 0.65);
  box-shadow:
    0 4px 14px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  vertical-align: middle;
`;

export const ExpenseCountChipNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.02em;
  box-shadow:
    0 2px 8px rgba(37, 99, 235, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
`;

export const ExpenseCountChipLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
  line-height: 1.2;
  padding-right: 2px;
`;

export const AmountText = styled.span`
  color: #0f172a;
  display: block;
  max-width: 100%;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;

  @media (max-width: 1180px) {
    font-size: 22px;
  }
`;

export const AmountSummary = styled.div`
  width: 100%;
  min-width: 0;
  text-align: right;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), #ffffff);
  border: 1px solid rgba(226, 232, 240, 0.9);
`;

export const AmountSummaryLabel = styled.span`
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.3;
`;

export const AmountSummarySub = styled.span`
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
`;

export const StatusPill = styled(CategoryPill)``;

export const RowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  flex-wrap: wrap;
  min-width: 0;
  width: 100%;

  ${({ $compact }) =>
    $compact
      ? css`
          flex-wrap: nowrap;
          gap: 8px;
          width: auto;
        `
      : null}

  .ant-btn {
    border-radius: 10px;
    width: 40px;
    height: 40px;
    padding: 0;
  }

  @media (max-width: 1320px) {
    justify-content: flex-start;
  }
`;

export const PinActionButton = styled(Button)`
  ${({ $active }) =>
    $active
      ? css`
          color: #1f76c7;
          background: rgba(31, 118, 199, 0.12);
          border-color: rgba(31, 118, 199, 0.16);
          box-shadow: 0 6px 16px rgba(31, 118, 199, 0.12);

          &:hover,
          &:focus {
            color: #135da0;
            background: rgba(31, 118, 199, 0.18);
            border-color: rgba(31, 118, 199, 0.24);
          }
        `
      : css`
          color: #64748b;

          &:hover,
          &:focus {
            color: #1f76c7;
            background: rgba(31, 118, 199, 0.08);
          }
        `}
`;

export const ReviewTable = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 16px 18px;

  @media (max-width: 1320px) {
    padding: 12px;
  }
`;

export const ReviewTableHead = styled.div`
  display: grid;
  grid-template-columns:
    minmax(220px, 2.1fr) minmax(150px, 0.95fr) minmax(130px, 0.9fr)
    minmax(110px, 0.75fr) 160px;
  gap: 12px;
  padding: 18px 20px;
  color: #96a5c1;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;

  > :nth-child(3),
  > :nth-child(4) {
    justify-self: center;
    text-align: center;
  }

  > :nth-child(5) {
    justify-self: center;
    text-align: center;
  }

  @media (max-width: 1320px) {
    display: none;
  }
`;

export const ReviewTableRow = styled.div`
  ${({ $pinned }) =>
    $pinned
      ? css`
          border-color: rgba(31, 118, 199, 0.34);
          background: linear-gradient(
            180deg,
            rgba(239, 247, 255, 0.98),
            rgba(247, 250, 255, 0.98)
          );
          box-shadow:
            0 16px 34px rgba(31, 118, 199, 0.12),
            inset 4px 0 0 #1f76c7;
        `
      : null}

  display: grid;
  grid-template-columns:
    minmax(220px, 2.1fr) minmax(150px, 0.95fr) minmax(130px, 0.9fr)
    minmax(110px, 0.75fr) 160px;
  gap: 12px;
  align-items: center;
  padding: 18px 20px;
  margin-top: 12px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #f8fbff);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: rgba(147, 197, 253, 0.7);
    background: linear-gradient(180deg, #ffffff, #f3f8ff);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.1);
    transform: translateY(-1px);
  }

  &:first-of-type {
    margin-top: 0;
  }

  > :nth-child(3),
  > :nth-child(4) {
    justify-self: center;
    text-align: center;
  }

  > :nth-child(5) {
    justify-self: center;
  }

  @media (max-width: 1320px) {
    grid-template-columns: 1fr;
    margin-top: 12px;
    padding: 18px;
  }
`;

export const AdminActions = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  box-sizing: border-box;
  flex-wrap: nowrap;

  .ant-btn {
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .ant-btn > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .admin-action-btn {
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease,
      color 0.18s ease;
  }

  .admin-action-btn:hover,
  .admin-action-btn:focus-visible {
    transform: translateY(-1px);
  }

  .admin-action-btn--approve {
    background: rgba(16, 185, 129, 0.14) !important;
    border: 1px solid rgba(16, 185, 129, 0.22) !important;
    color: #0f9f6e !important;
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.12);
  }
  .admin-action-btn--approve:hover,
  .admin-action-btn--approve:focus-visible {
    background: rgba(16, 185, 129, 0.16) !important;
    border-color: rgba(16, 185, 129, 0.3) !important;
  }

  .admin-action-btn--revision {
    background: rgba(59, 130, 246, 0.1) !important;
    border: 1px solid rgba(59, 130, 246, 0.22) !important;
    color: #2563eb !important;
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.12);
  }
  .admin-action-btn--revision:hover,
  .admin-action-btn--revision:focus-visible {
    background: rgba(59, 130, 246, 0.14) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;
  }

  .admin-action-btn--reject {
    background: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid rgba(239, 68, 68, 0.22) !important;
    color: #ef4444 !important;
    box-shadow: 0 8px 16px rgba(239, 68, 68, 0.12);
  }
  .admin-action-btn--reject:hover,
  .admin-action-btn--reject:focus-visible {
    background: rgba(239, 68, 68, 0.14) !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
  }

  .admin-action-btn--view {
    background: rgba(241, 245, 249, 0.92) !important;
    border: 1px solid rgba(226, 232, 240, 0.9) !important;
    color: #334155 !important;
  }
  .admin-action-btn--view:hover,
  .admin-action-btn--view:focus-visible {
    background: rgba(226, 232, 240, 0.7) !important;
    border-color: rgba(203, 213, 225, 0.9) !important;
    color: #0f172a !important;
  }

  .admin-action-btn--delete:hover,
  .admin-action-btn--delete:focus-visible {
    background: rgba(239, 68, 68, 0.1) !important;
  }

  .admin-actions__group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    min-width: 0;
    justify-content: center;
  }

  .admin-actions__group--meta {
    padding: 4px;
    border-radius: 16px;
    background: rgba(241, 245, 249, 0.92);
    border: 1px solid rgba(226, 232, 240, 0.9);
  }

  .admin-actions__group--decision {
    padding: 4px;
    border-radius: 16px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.88),
      rgba(248, 250, 252, 0.86)
    );
    border: 1px solid rgba(203, 213, 225, 0.7);
    align-self: center;
    box-shadow:
      0 12px 24px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    max-width: 132px;
    box-sizing: border-box;
  }

  .admin-actions__group--decision .ant-btn {
    width: 40px;
    height: 40px;
    border-radius: 14px;
  }

  @media (max-width: 1320px) {
    width: 100%;
    min-width: 0;
    max-width: none;
    justify-content: flex-end;
    flex-wrap: wrap;
    row-gap: 10px;
  }
`;

export const AdminActionStack = styled.div`
  display: contents;

  .ant-btn {
    justify-content: center;
  }
`;

export const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 0 18px;
`;

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 28px;
  border-top: 1px solid rgba(226, 232, 240, 0.75);
`;

export const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

export const ReviewTitle = styled.span`
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
`;

export const ReviewMeta = styled.span`
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
`;

export const ReviewReason = styled.div`
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.08);
  color: #8f1d1d;
  font-size: 14px;
  line-height: 1.6;
`;

export const RejectedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px 20px;
`;

export const RejectedCard = styled.div`
  ${surfaceCard};
  width: 100%;
  border: 1px solid rgba(215, 224, 239, 0.9);
  border-radius: 14px;
  padding: 18px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(244, 174, 58, 0.36);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  }
`;

export const RejectedCardSummary = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
`;

export const RejectedCardHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const RejectedCardTitle = styled.div`
  color: #0f172a;
  font-size: 17px;
  line-height: 1.35;
  font-weight: 700;
  word-break: break-word;
`;

export const RejectedCardSubtitle = styled.div`
  color: #8ea0bd;
  font-size: 13px;
  line-height: 1.5;
`;

export const RejectedCardTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const RejectedCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
`;

export const RejectedReasonCard = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.09),
    rgba(248, 113, 113, 0.08)
  );
  border: 1px solid rgba(248, 113, 113, 0.16);
`;

export const RejectedReasonLabel = styled.div`
  color: #9b1c1c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

export const RejectedReasonText = styled.div`
  color: #7f1d1d;
  font-size: 14px;
  line-height: 1.65;
`;

export const RejectedMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const RejectedMetaCard = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(244, 248, 255, 0.9);
  border: 1px solid rgba(221, 229, 241, 0.9);
`;

export const RejectedMetaLabel = styled.div`
  color: #8ea0bd;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 5px;
`;

export const RejectedMetaValue = styled.div`
  color: #16233b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
`;

export const RejectedActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const RejectedHint = styled.span`
  color: #8ea0bd;
  font-size: 13px;
`;

export const RejectedActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const SecondaryCompactButton = styled(Button)`
  height: 42px;
  border-radius: 10px;
  border-color: rgba(213, 221, 235, 0.92);
  font-weight: 700;
  color: #334667;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .anticon,
  .ant-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    line-height: 1;
    margin-inline-end: 0;
  }

  &:hover,
  &:focus {
    color: #1f5fb8;
    border-color: #cfe0f7;
    background: #ffffff;
  }
`;

export const PrimaryCompactButton = styled(Button)`
  height: 42px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  background: linear-gradient(135deg, #3da0ea 0%, #1f76c7 100%);
  box-shadow: 0 8px 16px rgba(31, 118, 199, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .anticon,
  .ant-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    line-height: 1;
    margin-inline-end: 0;
  }

  &:hover,
  &:focus {
    background: linear-gradient(135deg, #46a8f1 0%, #176fbf 100%);
  }
`;

export const ChartPanelBody = styled.div`
  padding: 18px 20px 28px;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 16px 16px 24px;
  }
`;

export const ChartCarouselDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 6px 0 22px;
`;

export const ChartCarouselDot = styled.button`
  width: ${({ $active }) => ($active ? "18px" : "8px")};
  height: 8px;
  border: 0;
  border-radius: 10px;
  padding: 0;
  background: ${({ $active }) =>
    $active ? "#1f76c7" : "rgba(159, 176, 204, 0.44)"};
  box-shadow: ${({ $active }) =>
    $active ? "0 8px 16px rgba(31, 118, 199, 0.22)" : "none"};
  cursor: pointer;
  transition: all 0.22s ease;

  &:hover,
  &:focus {
    background: ${({ $active }) =>
      $active ? "#1f76c7" : "rgba(47, 137, 217, 0.72)"};
  }
`;

export const ChartCarouselStage = styled.div`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
  min-height: 300px;

  @media (max-width: 600px) {
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    gap: 8px;
    min-height: 236px;
  }
`;

export const ChartMotionWrap = styled.div`
  animation: ${chartContentEntrance} 280ms ease;
  transform-origin: center center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

export const DonutChart = styled.div`
  width: min(100%, 260px);
  max-width: 100%;
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 50%;
  background: ${({ $background }) =>
    $background || "conic-gradient(#dbe7f6 0deg 360deg)"};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 600px) {
    width: min(100%, 200px);
  }
`;

export const DonutInner = styled.div`
  width: 68%;
  height: 68%;
  border-radius: 50%;
  background: #f8fbff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px 8px;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(221, 229, 241, 0.85);
`;

export const DonutValue = styled.span`
  color: #0f172a;
  max-width: 88%;
  font-size: clamp(24px, 3.2vw, 42px);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-align: center;
  font-variant-numeric: tabular-nums lining-nums;
`;

export const DonutLabel = styled.span`
  margin-top: 2px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

export const DonutMeta = styled.span`
  margin-top: 8px;
  color: #8fa0bd;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const LegendItem = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  color: #31415f;
  font-size: 16px;
`;

export const LegendDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background: ${({ $color }) => $color || "#2f89d9"};
`;

export const LegendValue = styled.span`
  color: #0f172a;
  font-weight: 700;
`;

export const LoadingState = styled.div`
  padding: 60px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ContentWrapper = styled.div`
  margin-top: 2.5rem;
`;

export const EContactsWrapper = styled.div`
  width: 100% !important;
  padding: 30px;
  justify-self: start !important;
  align-self: start !important;
`;

export const StyledInput = styled(Input)`
  border-radius: 16px !important;
  overflow: hidden !important;
  border: 1px solid rgba(213, 221, 235, 0.92) !important;
  background-color: #f8fbff !important;

  .ant-input-group-addon {
    border-radius: 16px 0 0 16px !important;
    overflow: hidden !important;
    border: 1px solid rgba(213, 221, 235, 0.92) !important;
    background-color: #f8fbff !important;
  }

  .ant-input {
    border-radius: 16px !important;
    overflow: hidden !important;
    border: 0 !important;
    background-color: #f8fbff !important;
  }
`;

export const StyledTextArea = styled(Input.TextArea)`
  .ant-input {
    border-radius: 16px !important;
    overflow: hidden !important;
    border: 1px solid rgba(213, 221, 235, 0.92) !important;
    background-color: #f8fbff !important;
  }
`;

export const StyledDatePicker = styled(DatePicker).attrs(() => ({
  format: "DD.MM.YYYY",
}))`
  border-radius: 16px !important;
  overflow: hidden !important;
  border: 1px solid rgba(213, 221, 235, 0.92) !important;
  background-color: #f8fbff !important;
`;

export const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 16px !important;
    overflow: hidden !important;
    border: 1px solid rgba(213, 221, 235, 0.92) !important;
    background-color: #f8fbff !important;
  }

  &.joined-select .ant-select-selector {
    border-radius: 0 16px 16px 0 !important;
    border-left: none !important;
  }
`;

export const StyledUploadDragger = styled(Upload.Dragger)`
  border-radius: 16px !important;
  overflow: hidden !important;
  border: 1px solid rgba(213, 221, 235, 0.92) !important;
  background-color: #f8fbff !important;
`;

export const StyledDivider = styled(Divider)`
  background-color: ${palette("secondary", 15)};
  margin: 12px 0 24px !important;
  width: 100%;
`;

export default Wrapper;
