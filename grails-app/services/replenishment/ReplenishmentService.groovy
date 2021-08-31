/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package replenishment

import org.apache.commons.beanutils.BeanUtils
import org.pih.warehouse.api.Replenishment
import org.pih.warehouse.api.ReplenishmentItem
import org.pih.warehouse.api.ReplenishmentStatus
import org.pih.warehouse.inventory.InventoryLevel
import org.pih.warehouse.inventory.Requirement
import org.pih.warehouse.core.Location
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.inventory.InventoryLevelStatus
import org.pih.warehouse.inventory.TransferStockCommand
import org.pih.warehouse.order.*

class ReplenishmentService {

    def locationService
    def inventoryService
    def productAvailabilityService
    def grailsApplication

    boolean transactional = true

    def getRequirements(Location location, InventoryLevelStatus inventoryLevelStatus) {
        return Requirement.createCriteria().list() {
            eq("location", location)
            eq("status", inventoryLevelStatus)
        }
    }

    Order createOrderFromReplenishment(Replenishment replenishment) {

        Order order = Order.get(replenishment.id)
        if (!order) {
            order = new Order()
        }

        // TODO: Is this TRANSFER_ORDER or something else?
        OrderType orderType = OrderType.findByCode(OrderTypeCode.TRANSFER_ORDER.name())
        order.orderType = orderType
        order.status = OrderStatus.valueOf(replenishment.status.toString())
        if (!order.orderNumber) {
            order.orderNumber = replenishment.replenishmentNumber
        }
        order.orderedBy = replenishment.orderedBy
        order.dateOrdered = new Date()
        order.origin = replenishment.origin
        order.destination = replenishment.destination

        // Set auditing data on completion
        if (replenishment.status == ReplenishmentStatus.COMPLETED) {
            order.completedBy = replenishment.orderedBy
            order.dateCompleted = new Date()
        }

        // Generate name
        order.name = order.generateName()

        replenishment.replenishmentItems.toArray().each { ReplenishmentItem replenishmentItem ->

            OrderItem orderItem
            if (replenishmentItem.id) {
                orderItem = order.orderItems?.find { it.id == replenishmentItem.id }
            }

            if (!orderItem) {
                orderItem = new OrderItem()
                order.addToOrderItems(orderItem)
            }

            updateOrderItem(replenishmentItem, orderItem)

            // TODO: Process pick items
        }

        order.save(failOnError: true)
        return order
    }

    Order deleteReplenishmentItem(String id) {
        OrderItem orderItem = OrderItem.get(id)
        if (!orderItem) {
            throw new IllegalArgumentException("No replenishment item found with ID ${id}")
        }

        // TODO: Remove picklist for this item

        Order order = orderItem.order
        order.removeFromOrderItems(orderItem)
        orderItem.delete()

        return order
    }

    OrderItem updateOrderItem(ReplenishmentItem replenishmentItem, OrderItem orderItem) {
        // TODO: If PICKED then COMPLETED, otherwise PENDING
        OrderItemStatusCode orderItemStatusCode = OrderItemStatusCode.PENDING

        orderItem.orderItemStatusCode = orderItemStatusCode
        orderItem.product = replenishmentItem.product
        orderItem.inventoryItem = replenishmentItem.inventoryItem
        orderItem.quantity = replenishmentItem.quantity
        orderItem.originBinLocation = replenishmentItem.replenishmentLocation
        orderItem.destinationBinLocation = replenishmentItem.binLocation
        return orderItem
    }

    Order completeReplenishment(Replenishment replenishment) {
        validateReplenishment(replenishment)

        // Save the replenishment as an order
        Order order = createOrderFromReplenishment(replenishment)

        // TODO: Process pick list items

        replenishment.replenishmentItems.each { ReplenishmentItem replenishmentItem ->
            TransferStockCommand command = new TransferStockCommand()
            command.location = replenishmentItem?.binLocation?.parentLocation?:replenishment?.origin
            command.binLocation = replenishmentItem.replenishmentLocation // origin
            command.inventoryItem = replenishmentItem.inventoryItem
            command.quantity = replenishmentItem.quantity
            command.otherLocation = replenishmentItem.location
            command.otherBinLocation = replenishmentItem.binLocation // destination
            command.order = order
            command.transferOut = Boolean.TRUE
            inventoryService.transferStock(command)
        }

        return order
    }

    void validateReplenishment(Replenishment replenishment) {
        replenishment.replenishmentItems.toArray().each { ReplenishmentItem replenishmentItem ->
            validateReplenishmentItem(replenishmentItem)
        }
    }

    void validateReplenishmentItem(ReplenishmentItem replenishmentItem) {
        def quantity = replenishmentItem.quantity

        // TODO: Sum pick list items quantity

        validateQuantityAvailable(replenishmentItem.replenishmentLocation, replenishmentItem.inventoryItem, quantity)
    }

    void validateQuantityAvailable(Location replenishmentLocation, InventoryItem inventoryItem, BigDecimal quantity) {

        if (!replenishmentLocation) {
            throw new IllegalArgumentException("Location is required")
        }

        Integer quantityAvailable = productAvailabilityService.getQuantityOnHandInBinLocation(inventoryItem, replenishmentLocation)
        log.info "Quantity: ${quantity} vs ${quantityAvailable}"

        if (quantityAvailable < 0) {
            throw new IllegalStateException("The inventory item is no longer available at the specified location ${replenishmentLocation}")
        }

        if (quantity > quantityAvailable) {
            throw new IllegalStateException("Quantity available ${quantityAvailable} is less than quantity to stock transfer ${quantity} for product ${inventoryItem.product.productCode} ${inventoryItem.product.name}")
        }
    }

    def refreshQuantities(Replenishment replenishment) {
        replenishment?.replenishmentItems?.each { ReplenishmentItem replenishmentItem ->
            replenishmentItem.quantityInBin = productAvailabilityService.getQuantityOnHandInBinLocation(replenishmentItem.inventoryItem, replenishmentItem.binLocation)
            replenishmentItem.totalQuantityOnHand = productAvailabilityService.getQuantityOnHand(replenishmentItem.product, replenishmentItem.location)
            def inventoryLevel = InventoryLevel.findByProductAndInternalLocation(replenishmentItem.product,replenishmentItem.binLocation)
            replenishmentItem.minQuantity = inventoryLevel.minQuantity
            replenishmentItem.maxQuantity = inventoryLevel.maxQuantity
        }
    }
}
