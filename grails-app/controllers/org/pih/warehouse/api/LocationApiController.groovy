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
import org.hibernate.Criteria
import org.pih.warehouse.core.ActivityCode
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.LocationType
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.inventory.InventoryLevel
import org.pih.warehouse.product.ProductAvailability

class LocationApiController extends BaseDomainApiController {

    def locationService
    def userService
    def identifierService
    def inventoryService
    def grailsApplication

    def list = {

        def minLength = grailsApplication.config.openboxes.typeahead.minLength
        if (params.name && params.name.size() < minLength) {
            render([data: []])
            return
        }

        Location currentLocation = Location.get(session?.warehouse?.id)
        User currentUser = User.get(session?.user?.id)
        boolean isSuperuser = userService.isSuperuser(session?.user)
        String direction = params?.direction
        def fields = params.fields ? params.fields.split(",") : null
        def locations
        def isRequestor = userService.isUserRequestor(currentUser)
        def inRoleBrowser = userService.isUserInRole(currentUser, RoleType.ROLE_BROWSER)
        def requestorInAnyLocation = userService.hasRoleRequestorInAnyLocations(currentUser)

        if (params.locationChooser && isRequestor && !currentUser.locationRoles && !inRoleBrowser) {
            locations = locationService.getLocations(null, null)
            locations = locations.findAll { it.supportedActivities && it.supports(ActivityCode.SUBMIT_REQUEST) }
        } else if (params.locationChooser && requestorInAnyLocation && inRoleBrowser) {
            locations = locationService.getRequestorLocations(currentUser)
            locations += locationService.getLocations(fields, params, isSuperuser, direction, currentLocation, currentUser)
        } else if (params.locationChooser && requestorInAnyLocation) {
            locations = locationService.getRequestorLocations(currentUser)
        } else {
            locations = locationService.getLocations(fields, params, isSuperuser, direction, currentLocation, currentUser)
        }
        render ([data:locations] as JSON)
     }


    def productSummary = {
        Location currentLocation = Location.load(session.warehouse.id)
        def data = ProductAvailability.createCriteria().list {
            resultTransformer(Criteria.ALIAS_TO_ENTITY_MAP)
            projections {
                product {
                    groupProperty("id", "productId")
                    groupProperty("name", "productName")
                    groupProperty("productCode", "productCode")
                }
                sum("quantityOnHand", "quantityOnHand")
            }
            eq("location", currentLocation)
        }
        render ([data:data] as JSON)

    }

    def create = { Location location ->
        JSONObject jsonObject = request.JSON

        bindLocationData(location, jsonObject)

        if (!location.validate() || !location.save(failOnError: true)) {
            throw new ValidationException("Invalid location ${location.name}", location.errors)
        }

        render ([data: location] as JSON)
    }

    def update = {
        JSONObject jsonObject = request.JSON

        Location existingLocation = Location.get(params.id)

        if (!existingLocation) {
            throw new IllegalArgumentException("No Location found for location ID ${params.id}")
        }

        bindLocationData(existingLocation, jsonObject)

        if (existingLocation.validate() && !existingLocation.hasErrors()) {
            if (existingLocation?.address?.validate() && !existingLocation?.address?.hasErrors()) {
                existingLocation.address.save()
            } else {
                throw new ValidationException("Address validation failed", existingLocation.errors)
            }
            def inventoryLevelInstance = InventoryLevel.findByInventoryAndProductIsNull(existingLocation.inventory)
            if (!inventoryLevelInstance) {
                inventoryLevelInstance = new InventoryLevel(inventory: existingLocation.inventory)
            }
            inventoryLevelInstance.properties = params
            inventoryLevelInstance.save()
            existingLocation.save()
        } else {
            throw new ValidationException("Invalid location ${existingLocation.name}", existingLocation.errors)
        }

        render([data: existingLocation] as JSON)
    }

    Location bindLocationData(Location location, JSONObject jsonObject) {
        bindData(location, jsonObject)

        if (!location.locationNumber) {
            location.locationNumber = identifierService.generateLocationIdentifier()
        }

        // TODO: should be changed in OBDS-100
        if (!location.locationType) {
            location.locationType = LocationType.findById('4')
        }

        if (!location.inventory) {
            location.inventory = inventoryService.addInventory(location)
        }


        return location
    }

    def updateForecastingConfiguration = {
        JSONObject jsonObject = request.JSON
        Location existingLocation = Location.get(params.id)

        if (!existingLocation) {
            throw new IllegalArgumentException("No Location found for location ID ${params.id}")
        }

        def inventoryLevelInstance = InventoryLevel.findByInventoryAndProductIsNull(existingLocation.inventory)

        if (!inventoryLevelInstance) {
            inventoryLevelInstance = new InventoryLevel(inventory: existingLocation.inventory)
        }
        bindData(inventoryLevelInstance, jsonObject)

        inventoryLevelInstance.save()

        render(status: 200)
    }
}
