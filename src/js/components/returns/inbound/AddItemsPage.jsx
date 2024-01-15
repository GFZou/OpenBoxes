import React, { Component } from 'react';

import arrayMutators from 'final-form-arrays';
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { confirmAlert } from 'react-confirm-alert';
import { Form } from 'react-final-form';
import { getTranslate } from 'react-localize-redux';
import { connect } from 'react-redux';
import Alert from 'react-s-alert';

import { fetchUsers, hideSpinner, showSpinner } from 'actions';
import ProductApi from 'api/services/ProductApi';
import ArrayField from 'components/form-elements/ArrayField';
import ButtonField from 'components/form-elements/ButtonField';
import DateField from 'components/form-elements/DateField';
import ProductSelectField from 'components/form-elements/ProductSelectField';
import SelectField from 'components/form-elements/SelectField';
import TextField from 'components/form-elements/TextField';
import { STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import apiClient, { flattenRequest, parseResponse } from 'utils/apiClient';
import { renderFormField } from 'utils/form-utils';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';

import 'react-confirm-alert/src/react-confirm-alert.css';

const DELETE_BUTTON_FIELD = {
  type: ButtonField,
  label: 'react.default.button.delete.label',
  defaultMessage: 'Delete',
  flexWidth: '1',
  fieldKey: '',
  buttonLabel: 'react.default.button.delete.label',
  buttonDefaultMessage: 'Delete',
  getDynamicAttr: ({
    fieldValue, removeItem, removeRow,
  }) => ({
    onClick: fieldValue && fieldValue.id ? () => {
      removeItem(fieldValue.id).then(() => {
        removeRow();
      });
    } : () => removeRow(),
    disabled: fieldValue && fieldValue.statusCode === 'SUBSTITUTED',
  }),
  attributes: {
    className: 'btn btn-outline-danger',
  },
};

const FIELDS = {
  returnItems: {
    type: ArrayField,
    arrowsNavigation: true,
    // eslint-disable-next-line react/prop-types
    addButton: ({ addRow, getSortOrder }) => (
      <button
        type="button"
        className="btn btn-outline-success btn-xs"
        onClick={() => addRow({ sortOrder: getSortOrder() })}
      >
        <span><i className="fa fa-plus pr-2" /><Translate id="react.default.button.addLine.label" defaultMessage="Add line" /></span>
      </button>),
    fields: {
      product: {
        type: ProductSelectField,
        label: 'react.inboundReturns.product.label',
        defaultMessage: 'Product',
        headerAlign: 'left',
        flexWidth: '4',
        required: true,
        getDynamicAttr: ({ rowIndex, originId, focusField }) => ({
          locationId: originId,
          onExactProductSelected: ({ product }) => {
            if (focusField && product) {
              focusField(rowIndex, 'quantity');
            }
          },
        }),
      },
      lotNumber: {
        type: TextField,
        label: 'react.inboundReturns.lot.label',
        defaultMessage: 'Lot',
        flexWidth: '1',
      },
      expirationDate: {
        type: DateField,
        label: 'react.inboundReturns.expiry.label',
        defaultMessage: 'Expiry',
        flexWidth: '1.5',
        attributes: {
          dateFormat: 'MM/DD/YYYY',
          autoComplete: 'off',
          placeholderText: 'MM/DD/YYYY',
        },
      },
      quantity: {
        type: TextField,
        label: 'react.inboundReturns.quantity.label',
        defaultMessage: 'Qty',
        flexWidth: '1',
        required: true,
        attributes: {
          type: 'number',
        },
      },
      recipient: {
        type: SelectField,
        label: 'react.inboundReturns.recipient.label',
        defaultMessage: 'Recipient',
        flexWidth: '1.5',
        getDynamicAttr: ({
          recipients, addRow, rowCount, rowIndex, getSortOrder,
        }) => ({
          options: recipients,
          onTabPress: rowCount === rowIndex + 1 ? () =>
            addRow({ sortOrder: getSortOrder() }) : null,
          arrowRight: rowCount === rowIndex + 1 ? () =>
            addRow({ sortOrder: getSortOrder() }) : null,
          arrowDown: rowCount === rowIndex + 1 ? () =>
            addRow({ sortOrder: getSortOrder() }) : null,
        }),
        attributes: {
          labelKey: 'name',
          openOnClick: false,
        },
      },
      deleteButton: DELETE_BUTTON_FIELD,
    },
  },
};

class AddItemsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inboundReturn: {},
      sortOrder: 0,
      formValues: { returnItems: [] },
      // isFirstPageLoaded: false,
    };

    this.props.showSpinner();
    this.removeItem = this.removeItem.bind(this);
    this.getSortOrder = this.getSortOrder.bind(this);
    this.confirmEmptyQuantitySave = this.confirmEmptyQuantitySave.bind(this);
    this.confirmExpirationDateSave = this.confirmExpirationDateSave.bind(this);
    this.confirmEmptyQuantitySave = this.confirmEmptyQuantitySave.bind(this);
    this.confirmValidationErrorOnPreviousPage =
      this.confirmValidationErrorOnPreviousPage.bind(this);
    this.validate = this.validate.bind(this);
  }

  componentDidMount() {
    if (this.props.inboundReturnsTranslationsFetched) {
      this.dataFetched = true;
      this.fetchInboundReturn();
      this.props.fetchUsers();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.inboundReturnsTranslationsFetched && !this.dataFetched) {
      this.dataFetched = true;
      this.fetchInboundReturn();
      this.props.fetchUsers();
    }
  }

  getSortOrder() {
    this.setState({
      sortOrder: this.state.sortOrder + 100,
    });

    return this.state.sortOrder;
  }
  dataFetched = false;

  validate(values) {
    const errors = {};
    errors.returnItems = [];
    const date = moment(this.props.minimumExpirationDate, 'MM/DD/YYYY');

    _.forEach(values.returnItems, (item, key) => {
      errors.returnItems[key] = {};
      if (!_.isNil(item.product) && (!item.quantity || item.quantity < 0)) {
        errors.returnItems[key] = { quantity: 'react.inboundReturns.error.enterQuantity.label' };
      }
      const dateRequested = moment(item.expirationDate, 'MM/DD/YYYY');
      if (date.diff(dateRequested) > 0) {
        errors.returnItems[key] = { expirationDate: 'react.inboundReturns.error.invalidDate.label' };
      }
      if (item.expirationDate && (_.isNil(item.lotNumber) || _.isEmpty(item.lotNumber))) {
        errors.returnItems[key] = { lotNumber: 'react.inboundReturns.error.expiryWithoutLot.label' };
      }
      if (!_.isNil(item.product) && item.product.lotAndExpiryControl) {
        if (!item.expirationDate && (_.isNil(item.lotNumber) || _.isEmpty(item.lotNumber))) {
          errors.returnItems[key] = {
            expirationDate: 'react.inboundReturns.error.lotAndExpiryControl.label',
            lotNumber: 'react.inboundReturns.error.lotAndExpiryControl.label',
          };
        } else if (!item.expirationDate) {
          errors.returnItems[key] = { expirationDate: 'react.inboundReturns.error.lotAndExpiryControl.label' };
        } else if (_.isNil(item.lotNumber) || _.isEmpty(item.lotNumber)) {
          errors.returnItems[key] = { lotNumber: 'react.inboundReturns.error.lotAndExpiryControl.label' };
        }
      }
    });
    return errors;
  }

  confirmValidationErrorOnExit() {
    return new Promise((resolve) => {
      confirmAlert({
        title: this.props.translate('react.inboundReturns.confirmSave.label', 'Confirm save'),
        message: this.props.translate(
          'react.inboundReturns.confirmExit.message',
          'Validation errors occurred. Are you sure you want to exit and lose unsaved data?',
        ),
        willUnmount: () => resolve(false),
        buttons: [
          {
            label: this.props.translate('react.default.yes.label', 'Yes'),
            onClick: () => resolve(true),
          },
          {
            label: this.props.translate('react.default.no.label', 'No'),
            onClick: () => resolve(false),
          },
        ],
      });
    });
  }

  confirmValidationErrorOnPreviousPage() {
    return new Promise((resolve) => {
      confirmAlert({
        title: this.props.translate('react.inboundReturns.confirmPreviousPage.label', 'Validation error'),
        message: this.props.translate('react.inboundReturns.confirmPreviousPage.message', 'Cannot save due to validation error on page'),
        willUnmount: () => resolve(false),
        buttons: [
          {
            label: this.props.translate('react.inboundReturns.confirmPreviousPage.correctError.label', 'Correct error'),
            onClick: () => resolve(true),
          },
          {
            label: this.props.translate('react.inboundReturns.confirmPreviousPage.continue.label', 'Continue (lose unsaved work)'),
            onClick: () => resolve(false),
          },
        ],
      });
    });
  }

  confirmEmptyQuantitySave() {
    return new Promise((resolve) => {
      confirmAlert({
        title: this.props.translate('react.inboundReturns.message.confirmSave.label', 'Confirm save'),
        message: this.props.translate(
          'react.inboundReturns.confirmSave.message',
          'Are you sure you want to save? There are some lines with empty or zero quantity, those lines will be deleted.',
        ),
        willUnmount: () => resolve(false),
        buttons: [
          {
            label: this.props.translate('react.default.yes.label', 'Yes'),
            onClick: () => resolve(true),
          },
          {
            label: this.props.translate('react.default.no.label', 'No'),
            onClick: () => resolve(false),
          },
        ],
      });
    });
  }

  confirmExpirationDateSave() {
    return new Promise((resolve) => {
      confirmAlert({
        title: this.props.translate('react.inboundReturns.message.confirmSave.label', 'Confirm save'),
        message: this.props.translate(
          'react.stockMovement.confirmExpiryDateUpdate.message',
          'This will update the expiry date across all depots in the system. Are you sure you want to proceed?',
        ),
        willUnmount: () => resolve(false),
        buttons: [
          {
            label: this.props.translate('react.default.yes.label', 'Yes'),
            onClick: () => resolve(true),
          },
          {
            label: this.props.translate('react.default.no.label', 'No'),
            onClick: () => resolve(false),
          },
        ],
      });
    });
  }

  fetchInboundReturn() {
    if (this.props.match.params.inboundReturnId) {
      this.props.showSpinner();
      const url = `/api/stockTransfers/${this.props.match.params.inboundReturnId}`;
      apiClient.get(url)
        .then((resp) => {
          const inboundReturn = parseResponse(resp.data.data);
          const returnItems = inboundReturn.stockTransferItems.length
            ? inboundReturn.stockTransferItems
            : new Array(1).fill({ sortOrder: 100 });

          const sortOrder = _.toInteger(_.last(returnItems).sortOrder) + 100;

          this.setState({
            inboundReturn,
            formValues: { returnItems },
            sortOrder,
          }, () => this.props.hideSpinner());
        })
        .catch(() => this.props.hideSpinner());
    }
  }

  async nextPage(formValues) {
    this.saveStockTransferInCurrentStep(formValues, this.state.inboundReturn.status !== 'PLACED' ? 'PLACED' : null)
      .then(() => this.props.nextPage(this.state.inboundReturn));
  }

  saveStockTransfer(returnItems, status) {
    const itemsToSave = _.filter(returnItems, (item) => item.product && item.quantity > 0);
    const updateItemsUrl = `/api/stockTransfers/${this.props.match.params.inboundReturnId}`;
    const payload = {
      ...this.state.inboundReturn,
      stockTransferItems: itemsToSave,
    };

    if (status) {
      payload.status = status;
    }

    if (payload.stockTransferItems.length) {
      this.props.showSpinner();
      return apiClient.post(updateItemsUrl, flattenRequest(payload))
        .then(() => this.fetchInboundReturn())
        .catch(() => Promise.reject(new Error(this.props.translate('react.inboundReturns.error.saveOrderItems.label', 'Could not save order items'))))
        .finally(() => this.props.hideSpinner());
    }

    return Promise.reject();
  }

  async saveStockTransferInCurrentStep(formValues, status = null) {
    const returnItems = _.filter(formValues.returnItems, (item) => !_.isEmpty(item) && item.product);

    const hasEmptyOrZeroValues = _.some(returnItems, (item) => !item.quantity || item.quantity === '0');

    if (hasEmptyOrZeroValues) {
      const isConfirmed = await this.confirmEmptyQuantitySave();
      if (!isConfirmed) {
        return Promise.reject();
      }
    }

    let isSomeItemsDontMatchExpirationDate = false;
    const itemsWithLotAndExpirationDate = returnItems.filter(it => it.expirationDate && it.lotNumber);

    // Trying to find at least one instance where the data that we are trying to save
    // does not match the expiration date of the existing inventoryItem in the system
    for (const it of itemsWithLotAndExpirationDate) {
      const { data } = await ProductApi.getInventoryItem(it.product?.id, it.lotNumber);
      if (data.inventoryItem && data.inventoryItem.expirationDate !== it.expirationDate) {
        isSomeItemsDontMatchExpirationDate = true;
        break;
      }
    }

    // After find at least a single instance where expiration date we are trying to save
    // does not match the existing inventoryItem expiration date, we want to inform the user
    // that certain updates to th expiration date in the system will be performed
    if (isSomeItemsDontMatchExpirationDate) {
      const isConfirmed = await this.confirmExpirationDateSave();
      if (!isConfirmed) {
        return Promise.reject();
      }
    }

    return this.saveStockTransfer(returnItems, status);
  }

  async save(formValues) {
    this.saveStockTransferInCurrentStep(formValues)
      .then(() => {
        Alert.success(
          this.props.translate(
            'react.inboundReturns.alert.saveSuccess.label',
            'Changes saved successfully',
          ),
          { timeout: 3000 },
        );
      });
  }

  async saveAndExit(formValues) {
    const errors = this.validate(formValues).returnItems;
    const hasErrors = errors.length && errors.some((obj) => typeof obj === 'object' && !_.isEmpty(obj));

    if (hasErrors) {
      const isConfirmed = await this.confirmValidationErrorOnExit();
      if (!isConfirmed) {
        return;
      }
    } else {
      try {
        await this.saveStockTransferInCurrentStep(formValues);
      } catch (error) {
        return;
      }
    }

    window.location = STOCK_MOVEMENT_URL.show(this.props.match.params.inboundReturnId);
  }

  refresh() {
    confirmAlert({
      title: this.props.translate('react.inboundReturns.message.confirmRefresh.label', 'Confirm refresh'),
      message: this.props.translate(
        'react.inboundReturns.confirmRefresh.message',
        'Are you sure you want to refresh? Your progress since last save will be lost.',
      ),
      buttons: [
        {
          label: this.props.translate('react.default.yes.label', 'Yes'),
          onClick: () => this.fetchInboundReturn(),
        },
        {
          label: this.props.translate('react.default.no.label', 'No'),
        },
      ],
    });
  }

  removeItem(itemId) {
    const removeItemsUrl = `/api/stockTransferItems/${itemId}`;

    return apiClient.delete(removeItemsUrl)
      .catch(() => {
        this.props.hideSpinner();
        return Promise.reject(new Error('react.inboundReturns.error.deleteOrderItem.label'));
      });
  }

  removeAll() {
    this.props.showSpinner();
    const removeItemsUrl = `/api/stockTransfers/${this.props.match.params.inboundReturnId}/removeAllItems`;

    return apiClient.delete(removeItemsUrl)
      .then(() => this.fetchInboundReturn())
      .catch(() => {
        this.props.hideSpinner();
        return Promise.reject(new Error('react.inboundReturns.error.deleteOrderItem.label'));
      });
  }

  async previousPage(values, invalid) {
    if (!invalid) {
      await this.saveStockTransfer(values.returnItems, null);
    } else {
      const correctErrors = await this.confirmValidationErrorOnPreviousPage();
      if (correctErrors) {
        return;
      }
    }
    this.props.previousPage(this.state.inboundReturn);
  }

  render() {
    return (
      <Form
        onSubmit={() => {}}
        validate={this.validate}
        mutators={{ ...arrayMutators }}
        initialValues={this.state.formValues}
        render={({ handleSubmit, values, invalid }) => (
          <div className="d-flex flex-column">
            <span className="buttons-container">
              <button
                type="button"
                disabled={invalid}
                onClick={() => this.save(values)}
                className="float-right mb-1 btn btn-outline-secondary align-self-end ml-1 btn-xs"
              >
                <span><i className="fa fa-save pr-2" /><Translate id="react.default.button.save.label" defaultMessage="Save" /></span>
              </button>
              <button
                type="button"
                disabled={invalid}
                onClick={() => this.saveAndExit(values)}
                className="float-right mb-1 btn btn-outline-secondary align-self-end ml-1 btn-xs"
              >
                <span><i className="fa fa-sign-out pr-2" /><Translate id="react.default.button.saveAndExit.label" defaultMessage="Save and exit" /></span>
              </button>
              <button
                type="button"
                disabled={invalid}
                onClick={() => this.removeAll()}
                className="float-right mb-1 btn btn-outline-danger align-self-end btn-xs"
              >
                <span><i className="fa fa-remove pr-2" /><Translate id="react.default.button.deleteAll.label" defaultMessage="Delete all" /></span>
              </button>
            </span>
            <form onSubmit={handleSubmit}>
              <div className="table-form">
                {_.map(FIELDS, (fieldConfig, fieldName) =>
                  renderFormField(fieldConfig, fieldName, {
                    recipients: this.props.recipients,
                    removeItem: this.removeItem,
                    getSortOrder: this.getSortOrder,
                    originId: this.props.initialValues.origin.id,
                  }))}
              </div>
              <div className="submit-buttons">
                <button
                  type="button"
                  onClick={() => this.previousPage(values, invalid)}
                  className="btn btn-outline-primary btn-form btn-xs"
                >
                  <Translate id="react.default.button.previous.label" defaultMessage="Previous" />
                </button>
                <button
                  type="submit"
                  onClick={() => {
                    if (!invalid) {
                      this.nextPage(values);
                    }
                  }}
                  className="btn btn-outline-primary btn-form float-right btn-xs"
                  disabled={
                    !_.some(values.returnItems, item => item.product && _.parseInt(item.quantity))
                  }
                ><Translate id="react.default.button.next.label" defaultMessage="Next" />
                </button>
              </div>
            </form>
          </div>
        )}
      />
    );
  }
}

const mapStateToProps = state => ({
  recipients: state.users.data,
  translate: translateWithDefaultMessage(getTranslate(state.localize)),
  inboundReturnsTranslationsFetched: state.session.fetchedTranslations.inboundReturns,
  minimumExpirationDate: state.session.minimumExpirationDate,
});

export default (connect(mapStateToProps, {
  showSpinner, hideSpinner, fetchUsers,
})(AddItemsPage));

AddItemsPage.propTypes = {
  initialValues: PropTypes.shape({
    origin: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  previousPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  recipients: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  translate: PropTypes.func.isRequired,
  inboundReturnsTranslationsFetched: PropTypes.bool.isRequired,
  minimumExpirationDate: PropTypes.string.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      inboundReturnId: PropTypes.string,
    }),
  }).isRequired,
};
