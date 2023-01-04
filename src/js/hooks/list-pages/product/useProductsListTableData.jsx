import fileDownload from 'js-file-download';
import _ from 'lodash';
import queryString from 'query-string';

import productApi from 'api/services/ProductApi';
import { PRODUCT_API } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useProductsListTableData = (filterParams) => {
  const messageId = 'react.productsList.fetch.fail.label';
  const defaultMessage = 'Unable to fetch products';
  const defaultSorting = {
    sort: 'lastUpdated',
    order: 'desc',
  };
  const getParams = (offset, currentLocation, tableState, sortingParams) => _.omitBy({
    offset: `${offset}`,
    max: `${tableState.pageSize}`,
    ...sortingParams,
    ...filterParams,
    catalogId: filterParams.catalogId && filterParams.catalogId.map(({ id }) => id),
    categoryId: filterParams.categoryId && filterParams.categoryId.map(({ id }) => id),
    tagId: filterParams.tagId && filterParams.tagId.map(({ id }) => id),
  }, (val) => {
    if (typeof val === 'boolean') {
      return !val;
    }
    return _.isEmpty(val);
  });
  const {
    tableRef,
    loading,
    tableData,
    onFetchHandler,
  } = useTableData({
    filterParams,
    url: PRODUCT_API,
    messageId,
    defaultMessage,
    defaultSorting,
    getParams,
  });

  const exportProducts = async (allProducts = false, withAttributes = false) => {
    const params = () => {
      if (allProducts) {
        return { format: 'csv' };
      }
      if (withAttributes) {
        return { format: 'csv', includeAttributes: true };
      }
      return {
        ..._.omit(tableData.currentParams, ['offset', 'max']),
        format: 'csv',
      };
    };

    const config = {
      params: params(),
      paramsSerializer: parameters => queryString.stringify(parameters),
    };
    const { data } = await productApi.getProducts(config);
    const date = new Date();
    const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
    const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
    fileDownload(data, `Products-${year}${month}${day}-${hour}${minutes}${seconds}`, 'text/csv');
  };
  return {
    tableData, tableRef, loading, onFetchHandler, exportProducts,
  };
};

export default useProductsListTableData;
