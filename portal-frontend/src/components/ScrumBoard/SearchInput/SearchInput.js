import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  SearchIcon,
  ClearIcon,
  SearchWrapper,
  Input,
  ClearButton,
} from './SearchInput.style';
import ClearSvg from './07-icon.svg';
import SearchSvg from './10-icon.svg';

export default function SearchInput({
  onChange = console.log,
  onFocus,
  onBlur,
}) {
  const intl = useIntl();
  const [searchData, setSearchData] = useState('');
  const handleSearch = event => {
    setSearchData(event.target.value);
    onChange(event.target.value);
  };

  return (
    <SearchWrapper>
      <SearchIcon src={SearchSvg} />
      <Input
        type="search"
        placeholder={intl.formatMessage({ id: 'scrumboard.search.placeholder' })}
        value={searchData}
        onChange={handleSearch}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {searchData && (
        <ClearButton onClick={() => {onChange(''); setSearchData('')}}>
          <ClearIcon src={ClearSvg} />
        </ClearButton>
      )}
    </SearchWrapper>
  );
}
