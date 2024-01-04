import React from 'react';

import PropTypes from 'prop-types';
import { RiCloseFill } from 'react-icons/all';
import Modal from 'react-modal';

import Button from 'components/form-elements/Button';
import { PRODUCT_SUPPLIER_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const PreferenceTypeModal = ({
  isOpen,
  closeModal,
  modalData,
  productSupplierId,
}) => {
  const mappedPreferenceTypes = modalData?.reduce((acc, preferenceType) => {
    const {
      preferenceType: { name },
      destinationParty,
    } = preferenceType;

    if (!destinationParty) {
      return {
        ...acc,
        default: {
          name,
        },
      };
    }

    return {
      ...acc,
      preferenceTypes: [
        ...acc.preferenceTypes,
        {
          destination: destinationParty?.name,
          name,
        },
      ],
    };
  }, { preferenceTypes: [], default: null });

  const redirectToEditProductSource = (id) => {
    window.location = PRODUCT_SUPPLIER_URL.edit(id);
  };

  return (
    <Modal isOpen={isOpen} className="modal-content">
      <div>
        <div className="d-flex justify-content-between">
          <p className="preference-type-modal-header">
            <Translate
              id="react.productSupplier.column.preferenceType.label"
              defaultMessage="Preference Type"
            />
          </p>
          <RiCloseFill
            size="32px"
            className="cursor-pointer"
            role="button"
            onClick={closeModal}
          />
        </div>
        <div className="preference-type-modal-list-container">
          <div>
            <p className="default-preference-type">
              <span className="preference-type-location">Default: </span>
              <span>{mappedPreferenceTypes?.default?.name}</span>
            </p>
          </div>
          <div className="preference-type-modal-list">
            {mappedPreferenceTypes?.preferenceTypes?.map((preferenceType) => (
              <p key={preferenceType?.destination}>
                <span className="preference-type-location">
                  {preferenceType?.destination}
                  :
                  {' '}
                </span>
                <span>{preferenceType?.name}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <Button
            defaultLabel="Edit"
            label="react.productSupplier.edit.label"
            onClick={() => redirectToEditProductSource(productSupplierId)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default PreferenceTypeModal;

PreferenceTypeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  modalData: PropTypes.arrayOf(PropTypes.shape({
    destinationParty: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      code: PropTypes.string,
      dateCreated: PropTypes.string,
      lastUpdated: PropTypes.string,
      partyType: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        code: PropTypes.string,
        partyTypeCode: PropTypes.string,
      }),
      roles: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        roleType: PropTypes.string,
        startDate: PropTypes.string,
        endDate: PropTypes.string,
      })),
      sequences: PropTypes.arrayOf(PropTypes.shape({})),
    }),
    preferenceType: PropTypes.shape({
      id: PropTypes.string.isRequired,
      dateCreated: PropTypes.string,
      lastUpdated: PropTypes.string,
      name: PropTypes.string,
    }),
  })).isRequired,
  productSupplierId: PropTypes.string.isRequired,
};