import React from "react";
import { SearchOutlined } from "@ant-design/icons";

import {
  HeroControls,
  HeroSearch,
  HeroSection,
  HeroSubtitle,
  HeroText,
  PageTitle,
} from "../Expense.styles";
import { getExpenseCopy } from "../utils/expenseI18n";

const ExpenseDashboardHeader = ({
  searchTerm,
  onSearchChange,
  title,
  subtitle,
  searchPlaceholder,
  actions = null,
}) => {
  const copy = getExpenseCopy();

  return (
    <HeroSection>
      <HeroText>
        <PageTitle>{title || copy.workerTitle}</PageTitle>
        <HeroSubtitle>{subtitle || copy.workerSubtitle}</HeroSubtitle>
      </HeroText>
      <HeroControls>
        {actions}
        <HeroSearch
          allowClear
          prefix={<SearchOutlined />}
          placeholder={searchPlaceholder || copy.workerSearchPlaceholder}
          value={searchTerm}
          onChange={onSearchChange}
        />
      </HeroControls>
    </HeroSection>
  );
};

export default ExpenseDashboardHeader;
