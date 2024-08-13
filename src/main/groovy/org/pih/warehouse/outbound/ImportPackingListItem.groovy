package org.pih.warehouse.outbound

import grails.databinding.BindUsing
import grails.util.Holders
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import grails.validation.Validateable
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.inventory.ProductAvailabilityService
import org.pih.warehouse.product.Product


class ImportPackingListItem implements Validateable {

    String rowId

    String palletName

    String boxName

    @BindUsing({ obj, source -> Product.findByProductCode(source['product']) })
    Product product

    String lotNumber

    Date expirationDate

    Location origin

    @BindUsing({ obj, source ->
        Location internalLocation = Location.findByNameAndParentLocation(source['binLocation'], obj.origin)
        // If location is not found, but we provided bin location name, it means, the location was not found,
        // and we want to indicate that, instead of falling back to default (null)
        // without this, we would then search e.g. for quantity available to promise for a product in the default bin location
        if (!internalLocation && source['binLocation'] && !source['binLocation'].equalsIgnoreCase(Constants.DEFAULT_BIN_LOCATION_NAME)) {
            // We want to indicate, that a bin location for given name has not been found.
            obj.binLocationFound = false
        }
        return internalLocation
     })
    Location binLocation

    Integer quantityPicked

    @BindUsing({ obj, source -> Person.findPersonByNameOrEmail(source['recipient'])})
    Person recipient

    /**
     * Flag to indicate whether binLocation has been found and bound.
     * We can't rely on binLocation = null, because we accept the null as DEFAULT,
     * so we want to know if the binLocation is null, because we have not provided (or provided DEFAULT) the bin location name
     * or the binLocation for such name does not exist.
     * This can't be done in the BindUsing and rejectValue, because the errors would be cleared before running the validator logic
     * The flag is set to false if a bin location is not found for given name in the BindUsing of binLocation
     */
    boolean binLocationFound = true


    static constraints = {
        rowId(blank: false)
        palletName(nullable: true)
        boxName(nullable: true, validator: { String boxName, ImportPackingListItem item ->
            if (boxName && !item.palletName) {
                return ['packLevel1.required']
            }
            return true
        })
        lotNumber(nullable: true, blank: true, validator: { String lotNumber, ImportPackingListItem item ->
            InventoryItem inventoryItem = item.product?.getInventoryItem(lotNumber)
            if (inventoryItem) {
                return true
            }
            return ['inventoryItemNotFound', lotNumber, item.product?.productCode]
        })
        expirationDate(nullable: true)
        binLocation(nullable: true)
        quantityPicked(min: 0, validator: { Integer quantityPicked, ImportPackingListItem item ->
            if (!item.binLocationFound) {
                return ['binLocationNotFound']
            }
            ProductAvailabilityService productAvailabilityService = Holders.grailsApplication.mainContext.getBean(ProductAvailabilityService)
            InventoryItem inventoryItem = item.product?.getInventoryItem(item.lotNumber)
            if (!inventoryItem) {
                return ['inventoryItemNotFound']
            }
            Integer quantity = productAvailabilityService.getQuantityAvailableToPromiseForProductInBin(item.origin, item.binLocation, inventoryItem)
            if (quantity <= 0) {
                return ['stockout']
            }
            if (quantityPicked > quantity) {
                return ['overpick', quantityPicked]
            }
            return true
        })
        binLocationFound(bindable: false)
    }
}
