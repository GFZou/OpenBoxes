import {
  ATTRIBUTES,
  PREFERENCE_TYPE_OPTIONS,
  PRODUCT_SUPPLIER_BY_ID,
  RATING_TYPE_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getPreferenceTypeOptions: (config) => apiClient.get(PREFERENCE_TYPE_OPTIONS, config),
  getRatingTypeOptions: (config) => apiClient.get(RATING_TYPE_OPTIONS, config),
  deleteProductSupplier: (id) => apiClient.delete(PRODUCT_SUPPLIER_BY_ID(id)),
  getProductSupplier: (id) => apiClient.get(PRODUCT_SUPPLIER_BY_ID(id)),
  getAttributes: (config) => apiClient.get(ATTRIBUTES, config),
};
