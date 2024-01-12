import React from 'react';

import PropTypes from 'prop-types';

import useQueryParams from 'hooks/useQueryParams';
import Translate from 'utils/Translate';

const Tabs = ({ config }) => {
  const parsedQueryParams = useQueryParams();
  return (
    <div className="tabs d-flex align-items-center">
      {Object.entries(config).map(([key, value]) => (
        <span
          key={key}
          className={parsedQueryParams?.tab === key ? 'active-tab' : ''}
          onClick={() => value.onClick?.(key)}
          role="presentation"
        >
          <Translate id={value.label.id} defaultMessage={value.label.defaultMessage} />
        </span>
      ))}
    </div>
  );
};

export default Tabs;

Tabs.propTypes = {
  config: PropTypes.shape({
    [PropTypes.string.isRequired]: PropTypes.shape({
      label: PropTypes.shape({
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string.isRequired,
      }).isRequired,
      onClick: PropTypes.func,
    }).isRequired,
  }).isRequired,
};
