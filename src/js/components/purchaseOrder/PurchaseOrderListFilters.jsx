import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { fetchBuyers, fetchPurchaseOrderStatuses } from 'actions';
import FilterForm from 'components/Filter/FilterForm';
import DateFilter from 'components/form-elements/DateFilter';
import FilterSelectField from 'components/form-elements/FilterSelectField';
import { debounceLocationsFetch, debounceUsersFetch } from 'utils/option-utils';

const filterFields = {
  status: {
    type: FilterSelectField,
    attributes: {
      multi: true,
      filterElement: true,
      placeholder: 'Status',
      showLabelTooltip: true,
      closeMenuOnSelect: false,
    },
    getDynamicAttr: ({ statuses }) => ({
      options: statuses,
    }),
  },
  statusStartDate: {
    type: DateFilter,
    attributes: {
      label: 'react.purchaseOrder.lastUpdateAfter.label',
      defaultMessage: 'Last update after',
      dateFormat: 'MM/DD/YYYY',
      filterElement: true,
    },
  },
  statusEndDate: {
    type: DateFilter,
    attributes: {
      label: 'react.purchaseOrder.lastUpdateBefore.label',
      defaultMessage: 'Last update before',
      dateFormat: 'MM/DD/YYYY',
      filterElement: true,
    },
  },
  origin: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: options => options,
      filterElement: true,
      placeholder: 'Supplier',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedOriginLocationsFetch,
    }) => ({
      loadOptions: debouncedOriginLocationsFetch,
    }),
  },
  destination: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: options => options,
      filterElement: true,
      placeholder: 'Destination',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedDestinationLocationsFetch,
    }) => ({
      loadOptions: debouncedDestinationLocationsFetch,
    }),
  },
  destinationParty: {
    type: FilterSelectField,
    attributes: {
      valueKey: 'id',
      filterElement: true,
      placeholder: 'Purchasing organization',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({ buyers, isCentralPurchasingEnabled }) => ({
      options: buyers,
      disabled: isCentralPurchasingEnabled,
    }),
  },
  orderedBy: {
    type: FilterSelectField,
    attributes: {
      async: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      valueKey: 'id',
      labelKey: 'name',
      options: [],
      filterOptions: options => options,
      filterElement: true,
      placeholder: 'Ordered by',
      showLabelTooltip: true,
    },
    getDynamicAttr: ({
      debouncedUsersFetch,
    }) => ({
      loadOptions: debouncedUsersFetch,
    }),
  },
};

const PurchaseOrderListFilters = ({
  setFilterParams,
  debounceTime,
  minSearchLength,
  supportedActivities,
  currentLocation,
  statuses,
  fetchStatuses,
  buyers,
  fetchBuyerOrganizations,
}) => {
  // Purchasing organizations (organizations with ROLE_BUYER)
  const [defaultValues, setDefaultValues] = useState({});
  const isCentralPurchasingEnabled = supportedActivities.includes('ENABLE_CENTRAL_PURCHASING');

  const determineDefaultValues = () => {
    // If central purchasing is enabled, set default purchasing org as currentLocation's org
    if (isCentralPurchasingEnabled) {
      setDefaultValues({
        destinationParty: buyers.find(org => org.id === currentLocation.organization.id),
      });
      setFilterParams(prevState => ({
        ...prevState,
        destinationParty: buyers.find(org => org.id === currentLocation.organization.id),
      }));
      return;
    }
    // If central purchasing is not enabled, set default destination as currentLocation
    setDefaultValues({
      destination: currentLocation,
    });
    setFilterParams(prevState => ({
      ...prevState,
      destination: currentLocation,
    }));
  };

  useEffect(() => {
    // If statuses not yet in store, fetch them
    if (!statuses || statuses.length === 0) {
      fetchStatuses();
    }

    if (!buyers || buyers.length === 0) {
      fetchBuyerOrganizations();
      return;
    }
    determineDefaultValues();
  }, [buyers, currentLocation]);

  const debouncedOriginLocationsFetch = debounceLocationsFetch(
    debounceTime,
    minSearchLength,
    ['FULFILL_ORDER'],
  );
  const debouncedDestinationLocationsFetch = debounceLocationsFetch(
    debounceTime,
    minSearchLength,
    ['RECEIVE_STOCK'],
  );
  const debouncedUsersFetch = debounceUsersFetch(debounceTime, minSearchLength);

  return (
    <div className="d-flex flex-column list-page-filters">
      <FilterForm
        filterFields={filterFields}
        onSubmit={values => setFilterParams(values)}
        formProps={{
          statuses,
          debouncedOriginLocationsFetch,
          debouncedDestinationLocationsFetch,
          debouncedUsersFetch,
          buyers,
          isCentralPurchasingEnabled,
        }}
        defaultValues={defaultValues}
        allowEmptySubmit
        searchFieldPlaceholder="Search by order number or name or supplier"
        hidden={false}
      />
    </div>
  );
};

const mapStateToProps = state => ({
  debounceTime: state.session.searchConfig.debounceTime,
  minSearchLength: state.session.searchConfig.minSearchLength,
  supportedActivities: state.session.supportedActivities,
  currentLocation: state.session.currentLocation,
  // All possible PO statuses from store
  statuses: state.purchaseOrder.statuses,
  buyers: state.organizations.buyers,
});

const mapDispatchToProps = {
  fetchStatuses: fetchPurchaseOrderStatuses,
  fetchBuyerOrganizations: fetchBuyers,
};

export default connect(mapStateToProps, mapDispatchToProps)(PurchaseOrderListFilters);

PurchaseOrderListFilters.propTypes = {
  setFilterParams: PropTypes.func.isRequired,
  debounceTime: PropTypes.number.isRequired,
  minSearchLength: PropTypes.number.isRequired,
  supportedActivities: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentLocation: PropTypes.shape({}).isRequired,
  statuses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
  })).isRequired,
  fetchStatuses: PropTypes.func.isRequired,
  buyers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
  })).isRequired,
  fetchBuyerOrganizations: PropTypes.func.isRequired,
};
