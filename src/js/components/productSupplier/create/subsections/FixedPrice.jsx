import React from 'react';

import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';

import CheckBox from 'components/form-elements/v2/Checkbox';
import DateField from 'components/form-elements/v2/DateField';
import TextInput from 'components/form-elements/v2/TextInput';
import Subsection from 'components/Layout/v2/Subsection';

const FixedPrice = ({ control, errors }) => (
  <Subsection
    title={{
      label: 'react.productSupplier.form.subsection.fixedPrice',
      defaultMessage: 'Fixed Price',
    }}
    collapsable={false}
  >
    <div className="row">
      <div className="col-lg-4 p-2">
        <Controller
          name="contractPricePrice"
          control={control}
          render={({ field }) => (
            <TextInput
              {...field}
              decimal={2}
              type="number"
              errorMessage={errors.contractPricePrice?.message}
              title={{
                id: 'react.productSupplier.form.contractPricePrice.title',
                defaultMessage: 'Contract Price Each',
              }}
              tooltip={{
                id: 'react.productSupplier.form.contractPricePrice.tooltip',
                defaultMessage: 'Fixed price per unit guaranteed by a contract with the supplier',
              }}
            />
          )}
        />
      </div>
      <div className="col-lg-4 p-2">
        <Controller
          name="contractPriceValidUntil"
          control={control}
          render={({ field }) => (
            <DateField
              title={{
                id: 'react.productSupplier.form.contractPriceValidUntil.title',
                defaultMessage: 'Price Valid Until',
              }}
              errorMessage={errors.contractPriceValidUntil?.message}
              {...field}
            />
          )}
        />
      </div>
      <div className="col-lg-4 p-2">
        <Controller
          name="tieredPricing"
          control={control}
          render={({ field }) => (
            <CheckBox
              title={{
                id: 'react.productSupplier.form.tieredPricing.title',
                defaultMessage: 'Tiered Pricing',
              }}
              tooltip={{
                id: 'react.productSupplier.form.tieredPricing.tooltip',
                defaultMessage: 'Indicates whether the supplier offers lower pricing for meeting specific quantity targets',
              }}
              {...field}
            />
          )}
        />
      </div>
    </div>
  </Subsection>
);

export default FixedPrice;

FixedPrice.propTypes = {
  control: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({
    contractPricePrice: PropTypes.shape({
      message: PropTypes.string,
    }),
    contractPriceValidUntil: PropTypes.shape({
      message: PropTypes.string,
    }),
    tieredPricing: PropTypes.shape({
      message: PropTypes.string,
    }),

  }).isRequired,
};
