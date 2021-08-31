/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.api

import grails.converters.JSON
import grails.validation.ValidationException
import org.codehaus.groovy.grails.web.json.JSONObject
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.inventory.InventoryLevelStatus
import org.pih.warehouse.inventory.Requirement
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderType
import org.pih.warehouse.order.OrderTypeCode

class ReplenishmentApiController {

    def identifierService
    def replenishmentService

    def list = {
        // TODO: How to distinguish replenishments from stock transfer orders?
        List<Order> replenishments = Order.findAllByOrderType(OrderType.get(OrderTypeCode.TRANSFER_ORDER.name()))
        render([data: replenishments.collect { it.toJson() }] as JSON)
    }

    def read = {
        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("No replenishment found for order ID ${params.id}")
        }

        Replenishment replenishment = Replenishment.createFromOrder(order)
        replenishmentService.refreshQuantities(replenishment)
        render([data: replenishment?.toJson()] as JSON)
    }

    def create = {
        JSONObject jsonObject = request.JSON

        User currentUser = User.get(session.user.id)
        Location currentLocation = Location.get(session.warehouse.id)
        if (!currentLocation || !currentUser) {
            throw new IllegalArgumentException("User must be logged into a location to update replenishment")
        }

        Replenishment replenishment = new Replenishment()

        bindReplenishmentData(replenishment, currentUser, currentLocation, jsonObject)

        Order order
        if (replenishment?.status == ReplenishmentStatus.COMPLETED) {
            order = replenishmentService.completeReplenishment(replenishment)
        } else {
            order = replenishmentService.createOrderFromReplenishment(replenishment)
            if (order.hasErrors() || !order.save(flush: true)) {
                throw new ValidationException("Invalid order", order.errors)
            }
        }

        replenishment = Replenishment.createFromOrder(order)
        replenishmentService.refreshQuantities(replenishment)
        render([data: replenishment?.toJson()] as JSON)
    }

    Replenishment bindReplenishmentData(Replenishment replenishment, User currentUser, Location currentLocation, JSONObject jsonObject) {
        bindData(replenishment, jsonObject)

        if (!replenishment.origin) {
            replenishment.origin = currentLocation
        }

        if (!replenishment.destination) {
            replenishment.destination = currentLocation
        }

        if (!replenishment.orderedBy) {
            replenishment.orderedBy = currentUser
        }

        if (!replenishment.replenishmentNumber) {
            replenishment.replenishmentNumber = identifierService.generateOrderIdentifier()
        }

        jsonObject.replenishmentItems.each { replenishmentItemMap ->
            ReplenishmentItem replenishmentItem = new ReplenishmentItem()
            bindData(replenishmentItem, replenishmentItemMap)
            if (!replenishmentItem.location) {
                replenishmentItem.location = replenishment.destination
            }

            // TODO: process pick list items

            replenishment.replenishmentItems.add(replenishmentItem)
        }

        return replenishment
    }

    def statusOptions = {
        render([data: InventoryLevelStatus.listReplenishmentOptions()?.collect { [ id: it.name(), label: it.name() ] }] as JSON)
    }

    def requirements = {
        Location location = Location.get(params.location.id)
        if (!location) {
            throw new IllegalArgumentException("Can't find location with given id: ${params.location.id}")
        }

        InventoryLevelStatus inventoryLevelStatus = InventoryLevelStatus.valueOf(params.inventoryLevelStatus) ?: InventoryLevelStatus.BELOW_MINIMUM
        List<Requirement> requirements = replenishmentService.getRequirements(location, inventoryLevelStatus)
        render([data: requirements?.collect { it.toJson() }] as JSON)
    }

    def removeItem = {
        Order order = replenishmentService.deleteReplenishmentItem(params.id)
        render([data: Replenishment.createFromOrder(order)?.toJson()] as JSON)
    }
}
