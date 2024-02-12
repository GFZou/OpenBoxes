import React, { useState } from 'react';

import PropTypes from 'prop-types';

import Select from 'utils/Select';
import InputWrapper from 'wrappers/InputWrapper';

import './style.scss';

const SelectField = ({
  title,
  tooltip,
  required,
  button,
  disabled,
  errorMessage,
  placeholder,
  async,
  options,
  loadOptions,
  defaultValue,
  multiple,
  onChange,
  ...fieldProps
}) => {
  const [value, setValue] = useState(defaultValue);

  const asyncProps = async ? {
    async,
    loadOptions,
  } : {
    options,
  };

  const onChangeValue = (selectedOption) => {
    onChange?.(selectedOption);
    setValue(selectedOption);
  };

  return (
    <InputWrapper
      title={title}
      errorMessage={errorMessage}
      button={{ ...button, onClick: () => button.onClick(value) }}
      tooltip={tooltip}
      required={required}
    >
      <Select
        className={`form-element-select ${errorMessage ? 'has-errors' : ''}`}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChangeValue}
        multi={multiple}
        {...asyncProps}
        {...fieldProps}
      />
    </InputWrapper>
  );
};

export default SelectField;

SelectField.propTypes = {
  // Message which will be shown on the tooltip above the field
  tooltip: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
  }),
  // Indicator whether the red asterisk has to be shown
  required: PropTypes.bool,
  // Title displayed above the field
  title: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
  }),
  // Button on the right side above the input
  button: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  // Indicator whether the field should be disabled
  disabled: PropTypes.bool,
  // If the errorMessage is not empty then the field is bordered
  // and the message is displayed under the input
  errorMessage: PropTypes.string,
  // Text displayed within input field
  placeholder: PropTypes.string,
  // Indicator whether options will be loaded asynchronously
  async: PropTypes.bool,
  // Predefined options, not loaded asynchronously
  options: PropTypes.arrayOf(PropTypes.object),
  // Function loading options asynchronously
  loadOptions: PropTypes.func,
  // Default value of the select
  defaultValue: PropTypes.string,
  // Indicator whether we should be able to choose multiple options
  multiple: PropTypes.bool,
  // Function triggered on change
  onChange: PropTypes.func,
};

SelectField.defaultProps = {
  tooltip: null,
  required: false,
  title: null,
  button: null,
  errorMessage: null,
  disabled: false,
  placeholder: '',
  async: false,
  options: [],
  loadOptions: () => [],
  defaultValue: null,
  multiple: false,
  onChange: () => {},
};
