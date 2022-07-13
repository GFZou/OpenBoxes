package org.pih.warehouse.inventory

import grails.converters.JSON
import grails.test.mixin.Mock
import grails.test.mixin.TestFor
import grails.test.mixin.TestMixin
import grails.test.mixin.domain.DomainClassUnitTestMixin
import org.pih.warehouse.core.Location
import org.pih.warehouse.product.Product
import spock.lang.Ignore
import spock.lang.Specification

@TestFor(InventoryItemController)
@Mock([Location, InventoryItem, TransactionEntry])
@TestMixin(DomainClassUnitTestMixin)
class InventoryItemControllerTests extends Specification {
    Product p = new Product(id:"pro1", name:"product1")
    Inventory inventory = new Inventory(id: "inventory1")

    void setup() {
        Location myLocation = new Location(id: "1234", inventory: inventory)
        InventoryItem i1 = new InventoryItem(id: "item1", product: p)
        InventoryItem i2 = new InventoryItem(id: "item2", product: p)
        InventoryItem i3 = new InventoryItem(id: "item3", product: p)
        InventoryItem i4 = new InventoryItem(id: "item4", product: p)

        mockDomain(Product, [p])
        mockDomain(Inventory, [inventory])
        mockDomain(Location, [myLocation])
        mockDomain(InventoryItem, [i1, i2, i3, i4])
        mockDomain(InventoryLevel, [])
        mockCommandObject(RecordInventoryCommand)
        mockDomain(Location, [myLocation])
        mockDomain(Inventory, [inventory])

        controller.inventoryService = [
                populateRecordInventoryCommand: { commandInstance, userInventory ->

                },
                getTransactionEntriesByInventoryAndProduct: { inventoryInstance, productInstance ->

                },
                getQuantityByProductMap: { transactionEntryList ->
                    return [:]
                },
                getInventoryItemsWithQuantity: { product, inv ->
                    return ["pro1": [[id:"item1"], [id:"item2"], [id:"item3"], [id:"item4"]]]
                },
                getQuantityByProductMap { transactionEntryList ->
                    return [:]
                },
                getQuantityAvailableToPromise { location, product ->
                    return 0
                },
        ]

        controller.forecastingService = [
                getDemand: { location, product ->
                    [:]
                }
        ]

        controller.session.warehouse = myLocation
    }

    @Ignore
    void "test showRecordInventory"() {
        when:
        RecordInventoryCommand command = new RecordInventoryCommand(product: p, inventory: inventory)
        controller.params.id = "pro1"
        def model = controller.showRecordInventory(command)

        then:
        def json = JSON.parse(model.product)
        json != null
        json.product.name == "product1"
        json.inventoryItems != null
    }
}
