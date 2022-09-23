import React, { useEffect, useRef, useState } from 'react';

import fileDownload from 'js-file-download';
import _ from 'lodash';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { confirmAlert } from 'react-confirm-alert';
import {
  RiArrowGoBackLine,
  RiChat3Line,
  RiDeleteBinLine,
  RiDownload2Line,
  RiFileLine,
  RiInformationLine,
  RiListUnordered,
  RiPencilLine,
  RiPrinterLine,
  RiShoppingCartLine,
} from 'react-icons/all';
import { RiCloseLine } from 'react-icons/ri';
import { getTranslate } from 'react-localize-redux';
import { connect } from 'react-redux';
import Alert from 'react-s-alert';

import { hideSpinner, showSpinner } from 'actions';
import DataTable from 'components/DataTable';
import Button from 'components/form-elements/Button';
import PurchaseOrderStatus from 'components/purchaseOrder/PurchaseOrderStatus';
import ActionDots from 'utils/ActionDots';
import apiClient from 'utils/apiClient';
import { findActions } from 'utils/list-utils';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';

import 'react-table/react-table.css';
import 'react-confirm-alert/src/react-confirm-alert.css';


const PurchaseOrderListTable = ({
  filterParams,
  supportedActivities,
  highestRole,
  showTheSpinner,
  hideTheSpinner,
  translate,
  currencyCode,
  currentLocation,
  buyers,
  allStatuses,
  isUserApprover,
}) => {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(-1);
  const [totalPrice, setTotalPrice] = useState(0.0);
  // Stored searching params for export case
  const [currentParams, setCurrentParams] = useState({});

  // Util ref for react-table to force the fetch of data
  const tableRef = useRef(null);
  const fireFetchData = () => {
    tableRef.current.fireFetchData();
  };
  const isCentralPurchasingEnabled = supportedActivities.includes('ENABLE_CENTRAL_PURCHASING');

  // If filterParams change, refetch the data with applied filters
  useEffect(() => fireFetchData(), [filterParams, currentLocation]);

  // If orderItems is true, download orders line items details, else download orders
  const downloadOrders = (orderItems) => {
    apiClient.get('/openboxes/api/purchaseOrders', {
      params: {
        ..._.omit(currentParams, 'offset', 'max'),
        format: 'csv',
        orderItems,
      },
      paramsSerializer: params => queryString.stringify(params),
    })
      .then((res) => {
        fileDownload(res.data, orderItems ? 'OrdersLineDetails.csv' : 'Orders', 'text/csv');
      });
  };


  const deleteOrder = (id) => {
    showTheSpinner();
    apiClient.delete(`/openboxes/api/purchaseOrders/${id}`)
      .then((res) => {
        if (res.status === 204) {
          hideTheSpinner();
          const successMessage = translate('react.purchaseOrder.delete.success.label', 'Purchase order has been deleted successfully');
          Alert.success(successMessage);
          fireFetchData();
        }
      })
      .catch(() => {
        hideTheSpinner();
        fireFetchData();
      });
  };

  const deleteHandler = (id) => {
    confirmAlert({
      title: translate('react.default.areYouSure.label', 'Are you sure?'),
      message: translate(
        'react.purchaseOrder.delete.confim.title.label',
        'Are you sure you want to delete this purchase order?',
      ),
      buttons: [
        {
          label: translate('react.default.yes.label', 'Yes'),
          onClick: () => deleteOrder(id),
        },
        {
          label: translate('react.default.no.label', 'No'),
        },
      ],
    });
  };

  const rollbackOrder = (id) => {
    apiClient.post(`/openboxes/api/purchaseOrders/${id}/rollback`)
      .then((response) => {
        if (response.status === 200) {
          Alert.success(translate('react.purchaseOrder.rollback.success.label', 'Rollback of order status has been done successfully'));
          fireFetchData();
        }
      });
  };

  const rollbackHandler = (id) => {
    if (!isUserApprover) {
      Alert.error(translate('react.default.errors.noPermissions.label', 'You do not have permissions to perform this action'));
      return;
    }
    const order = ordersData.find(ord => ord.id === id);
    if (order && order.shipmentsCount > 0) {
      Alert.error(translate('react.purchaseOrder.rollback.error.label', 'Cannot rollback order with associated shipments'));
      return;
    }
    confirmAlert({
      title: translate('react.default.areYouSure.label', 'Are you sure?'),
      message: translate(
        'react.purchaseOrder.rollback.confirm.title.label',
        'Are you sure you want to rollback this order?',
      ),
      buttons: [
        {
          label: translate('react.default.yes.label', 'Yes'),
          onClick: () => rollbackOrder(id),
        },
        {
          label: translate('react.default.no.label', 'No'),
        },
      ],
    });
  };

  const printOrder = (id) => {
    const order = ordersData.find(ord => ord.id === id);
    if (order && order.status && order.status.toUpperCase() === 'PENDING') {
      Alert.error('Order must be placed in order to print');
      return;
    }
    window.open(`/openboxes/order/print/${id}`, '_blank');
  };

  const cancelOrder = () => {
    Alert.error(translate('react.default.featureNotSupported', 'This feature is not currently supported'));
  };


  // List of all actions for PO rows
  const actions = [
    {
      label: 'react.purchaseOrder.viewOrderDetails.label',
      defaultLabel: 'View order details',
      leftIcon: <RiInformationLine />,
      href: '/openboxes/order/show',
    },
    {
      label: 'react.purchaseOrder.addComment.label',
      defaultLabel: 'Add comment',
      leftIcon: <RiChat3Line />,
      activityCode: ['PLACE_ORDER'],
      href: '/openboxes/order/addComment',
    },
    {
      label: 'react.purchaseOrder.addDocument.label',
      defaultLabel: 'Add document',
      leftIcon: <RiFileLine />,
      activityCode: ['PLACE_ORDER'],
      href: '/openboxes/order/addDocument',
    },
    {
      label: 'react.purchaseOrder.edit.label',
      defaultLabel: 'Edit order',
      leftIcon: <RiPencilLine />,
      statuses: ['PENDING'],
      activityCode: ['PLACE_ORDER'],
      href: '/openboxes/purchaseOrder/edit',
    },
    {
      label: 'react.purchaseOrder.editLineItems.label',
      defaultLabel: 'Edit line items',
      leftIcon: <RiListUnordered />,
      statuses: ['PENDING'],
      activityCode: ['PLACE_ORDER'],
      href: '/openboxes/purchaseOrder/addItems',
    },
    {
      label: 'react.purchaseOrder.placeOrder.label',
      defaultLabel: 'Place order',
      leftIcon: <RiShoppingCartLine />,
      statuses: ['PENDING'],
      activityCode: ['PLACE_ORDER'],
      href: '/openboxes/order/placeOrder',
    },
    {
      label: 'react.purchaseOrder.printOrder.label',
      defaultLabel: 'Print order',
      leftIcon: <RiPrinterLine />,
      activityCode: ['PLACE_ORDER'],
      onClick: id => printOrder(id),
    },
    {
      label: 'react.purchaseOrder.cancelOrder.label',
      defaultLabel: 'Cancel order',
      leftIcon: <RiCloseLine />,
      activityCode: ['PLACE_ORDER'],
      onClick: () => cancelOrder(),
    },
    {
      label: 'react.purchaseOrder.rollbackOrder.label',
      defaultLabel: 'Rollback Order',
      leftIcon: <RiArrowGoBackLine />,
      minimumRequiredRole: 'Superuser',
      activityCode: ['PLACE_ORDER'],
      // Display for statuses > PENDING
      statuses: allStatuses.filter(stat => stat.id !== 'PENDING').map(status => status.id),
      onClick: id => rollbackHandler(id),
    },
    {
      label: 'react.purchaseOrder.delete.label',
      defaultLabel: 'Delete',
      leftIcon: <RiDeleteBinLine />,
      minimumRequiredRole: 'Assistant',
      variant: 'danger',
      onClick: id => deleteHandler(id),
    },
  ];

  // Columns for react-table
  const columns = [
    {
      Header: ' ',
      width: 50,
      fixed: 'left',
      sortable: false,
      style: { overflow: 'visible', zIndex: 1 },
      Cell: row => (
        <ActionDots
          dropdownPlacement="right"
          dropdownClasses="action-dropdown-offset"
          actions={findActions(actions, row, supportedActivities, highestRole)}
          id={row.original.id}
        />),
    },
    {
      Header: 'Status',
      accessor: 'status',
      className: 'active-circle',
      headerClassName: 'header',
      fixed: 'left',
      maxWidth: 100,
      Cell: row => (<PurchaseOrderStatus status={row.original.status} />),
    },
    {
      Header: 'Order Number',
      accessor: 'orderNumber',
      fixed: 'left',
      width: 150,
      Cell: row => (
        <a href={`/openboxes/order/show/${row.original.id}`}>{row.original.orderNumber}</a>
      ),
    },
    {
      Header: 'Name',
      accessor: 'name',
      fixed: 'left',
      minWidth: 250,
      Cell: row => (
        <a href={`/openboxes/order/show/${row.original.id}`}>{row.original.name}</a>
      ),
    },
    {
      Header: 'Supplier',
      accessor: 'origin',
      minWidth: 300,
    },
    {
      Header: 'Destination',
      accessor: 'destination',
      minWidth: 300,
    },
    {
      Header: 'Ordered On',
      accessor: 'dateOrdered',
      minWidth: 120,
      Cell: row => (
        <span>{row.original.dateOrdered}</span>
      ),
    },
    {
      Header: 'Ordered By',
      accessor: 'orderedBy',
      headerClassName: 'text-left',
      minWidth: 120,
    },
    {
      Header: 'Line Items',
      accessor: 'orderItemsCount',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    {
      Header: 'Ordered',
      accessor: 'orderedOrderItemsCount',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    {
      Header: 'Shipped',
      accessor: 'shippedItemsCount',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    {
      Header: 'Received',
      accessor: 'receivedItemsCount',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    {
      Header: 'Invoiced',
      accessor: 'invoicedItemsCount',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    {
      Header: 'Total amount (local currency)',
      accessor: 'total',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
      minWidth: 230,
    },
    {
      Header: 'Total amount (default currency)',
      accessor: 'totalNormalized',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
      minWidth: 230,
    },
  ];

  const destinationParam = () => {
    if (filterParams.destination === null) {
      return '';
    }
    if (filterParams.destination && filterParams.destination.id) {
      return filterParams.destination.id;
    }
    if (!isCentralPurchasingEnabled) {
      return currentLocation.id;
    }
    return '';
  };

  const destinationPartyParam = () => {
    if (filterParams.destinationParty && filterParams.destinationParty.id) {
      return filterParams.destinationParty.id;
    }
    if (isCentralPurchasingEnabled) {
      return buyers && buyers.find(org => org.id === currentLocation.organization.id).id;
    }
    return '';
  };

  const onFetchHandler = (state) => {
    const offset = state.page > 0 ? (state.page) * state.pageSize : 0;
    const sortingParams = state.sorted.length > 0 ?
      {
        sort: state.sorted[0].id,
        order: state.sorted[0].desc ? 'desc' : 'asc',
      } :
      {
        sort: 'dateOrdered',
        order: 'desc',
      };
    const statusParam = filterParams.status &&
      filterParams.status.map(status => status.value);
    const params = {
      ..._.omitBy({
        offset: `${offset}`,
        max: `${state.pageSize}`,
        ...sortingParams,
        ..._.omit(filterParams, 'status'),
        status: statusParam,
        origin: filterParams.origin && filterParams.origin.id,
        orderedBy: filterParams.orderedBy && filterParams.orderedBy.id,
        destinationParty: destinationPartyParam(),
      }, _.isEmpty),
      destination: destinationParam(),
    };

    // Fetch data
    setLoading(true);
    apiClient.get('/openboxes/api/purchaseOrders', {
      params,
      paramsSerializer: parameters => queryString.stringify(parameters),
    })
      .then((res) => {
        setLoading(false);
        setPages(Math.ceil(res.data.totalCount / state.pageSize));
        setOrdersData(res.data.data);
        setTotalPrice(res.data.totalPrice);
        // Store currently used params for export case
        setCurrentParams({
          offset: `${offset}`,
          max: `${state.pageSize}`,
          ...sortingParams,
          ..._.omit(filterParams, 'status'),
          status: statusParam,
          destination: destinationParam(),
          destinationParty: destinationPartyParam(),
        });
      })
      .catch(() => Promise.reject(new Error(this.props.translate('react.purchaseOrder.error.purchaseOrderList.label', 'Could not fetch purchase order list'))));
  };

  return (
    <div className="list-page-list-section">
      <div className="title-text p-3 d-flex justify-content-between align-items-center">
        <span>
          <Translate id="react.purchaseOrder.listOrders.label" defaultMessage="List Orders" />
          &nbsp;
          (<Translate id="react.purchaseOrder.totalAmount.label" defaultMessage="Total amount" />: {totalPrice} {currencyCode})
        </span>
        <div className="btn-group">
          <Button
            defaultLabel="Export"
            label="react.purchaseOrder.export.button.label"
            variant="dropdown"
            EndIcon={<RiDownload2Line />}
          />
          <div className="dropdown-menu dropdown-menu-right nav-item padding-8" aria-labelledby="dropdownMenuButton">
            <a href="#" className="dropdown-item" onClick={() => downloadOrders(true)} role="button" tabIndex={0}>
              <Translate
                id="react.purchaseOrder.export.orderLineDetails.label"
                defaultMessage="Export order line details"
              />
            </a>
            <a className="dropdown-item" onClick={() => downloadOrders(false)} href="#">
              <Translate
                id="react.purchaseOrder.export.orders.label"
                defaultMessage="Export orders"
              />
            </a>
          </div>
        </div>
      </div>
      <DataTable
        manual
        sortable
        ref={tableRef}
        columns={columns}
        data={ordersData}
        loading={loading}
        defaultPageSize={10}
        pages={pages}
        onFetchData={onFetchHandler}
        className="mb-1"
        noDataText="No orders match the given criteria"
        footerComponent={() => (
          <span className="title-text p-1 d-flex flex-1 justify-content-end">
            <Translate id="react.purchaseOrder.totalAmount.label" defaultMessage="Total amount" />: {totalPrice} {currencyCode}
          </span>
        )}
      />
    </div>
  );
};

const mapStateToProps = state => ({
  supportedActivities: state.session.supportedActivities,
  highestRole: state.session.highestRole,
  translate: translateWithDefaultMessage(getTranslate(state.localize)),
  currencyCode: state.session.currencyCode,
  currentLocation: state.session.currentLocation,
  buyers: state.organizations.buyers,
  allStatuses: state.purchaseOrder.statuses,
  isUserApprover: state.session.isUserApprover,
});

const mapDispatchToProps = {
  showTheSpinner: showSpinner,
  hideTheSpinner: hideSpinner,
};

export default connect(mapStateToProps, mapDispatchToProps)(PurchaseOrderListTable);


PurchaseOrderListTable.propTypes = {
  filterParams: PropTypes.shape({}).isRequired,
  supportedActivities: PropTypes.arrayOf(PropTypes.string).isRequired,
  highestRole: PropTypes.string.isRequired,
  showTheSpinner: PropTypes.func.isRequired,
  hideTheSpinner: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired,
  currencyCode: PropTypes.string.isRequired,
  currentLocation: PropTypes.shape({}).isRequired,
  buyers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
  })).isRequired,
  allStatuses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
  })).isRequired,
  isUserApprover: PropTypes.bool,
};

PurchaseOrderListTable.defaultProps = {
  isUserApprover: false,
};
