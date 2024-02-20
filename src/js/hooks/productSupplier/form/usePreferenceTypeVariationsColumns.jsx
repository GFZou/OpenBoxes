import React, { useEffect, useMemo } from 'react';

import { Controller } from 'react-hook-form';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';

import { fetchBuyers, fetchPreferenceTypes } from 'actions';
import DateField from 'components/form-elements/v2/DateField';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';

const usePreferenceTypeVariationsColumns = ({ productSupplierPreferences, control, remove }) => {
  const dispatch = useDispatch();
  const {
    preferenceTypes,
    buyers,
  } = useSelector((state) => ({
    preferenceTypes: state.productSupplier.preferenceTypes,
    buyers: state.organizations.buyers,
  }));

  useEffect(() => {
    dispatch(fetchPreferenceTypes());
    dispatch(fetchBuyers());
  }, []);

  const columns = useMemo(() => [
    {
      Header: 'Site Name',
      sortable: false,
      accessor: 'destinationParty',
      minWidth: 300,
      Cell: (row) => (
        <Controller
          key={row.original.id}
          name={`productSupplierPreferences.${row.index}.destinationParty`}
          control={control}
          render={({ field }) => (
            <SelectField
              options={buyers}
              errorMessage={
                productSupplierPreferences?.[row.index]?.destinationParty?.message
              }
              {...field}
            />
          )}
        />
      ),
    },
    {
      Header: 'Preference Type',
      sortable: false,
      accessor: 'preferenceType',
      minWidth: 300,
      Cell: (row) => (
        <Controller
          name={`productSupplierPreferences.${row.index}.preferenceType`}
          control={control}
          key={row.original.id}
          render={({ field }) => (
            <SelectField
              options={preferenceTypes}
              errorMessage={
                productSupplierPreferences?.[row.index]?.preferenceType?.message
              }
              {...field}
            />
          )}
        />
      ),
    },
    {
      Header: 'Valid End Date',
      sortable: false,
      accessor: 'validityEndDate',
      minWidth: 179,
      Cell: (row) => (
        <Controller
          name={`productSupplierPreferences.${row.index}.validityEndDate`}
          control={control}
          key={row.original.id}
          render={({ field }) => (
            <DateField
              errorMessage={
                productSupplierPreferences?.[row.index]?.validityEndDate?.message
              }
              {...field}
            />
          )}
        />
      ),
    },
    {
      Header: 'Valid Start Date',
      sortable: false,
      accessor: 'validityStartDate',
      style: { overflow: 'visible' },
      minWidth: 179,
      Cell: (row) => (
        <Controller
          name={`productSupplierPreferences.${row.index}.validityStartDate`}
          control={control}
          key={row.original.id}
          render={({ field }) => (
            <DateField
              errorMessage={
                productSupplierPreferences?.[row.index]?.validityStartDate?.message
              }
              {...field}
            />
          )}
        />
      ),
    },
    {
      Header: 'Bid Name',
      sortable: false,
      accessor: 'bidName',
      minWidth: 300,
      Cell: (row) => (
        <Controller
          name={`productSupplierPreferences.${row.index}.bidName`}
          control={control}
          key={row.original.id}
          render={({ field }) => (
            <TextInput
              errorMessage={
                productSupplierPreferences?.[row.index]?.bidName?.message
              }
              {...field}
            />
          )}
        />
      ),
    },
    {
      Header: 'Actions',
      sortable: false,
      minWidth: 70,
      headerClassName: 'justify-content-center',
      className: 'd-flex justify-content-center align-items-center',
      Cell: (row) => (
        <RiDeleteBinLine
          onClick={() => remove(row.index)}
          className="preference-type-variations-bin"
        />
      ),
    },
  ], [productSupplierPreferences]);

  return { columns };
};

export default usePreferenceTypeVariationsColumns;
