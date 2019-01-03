/**
* Copyright (c) 2012 Partners In Health.  All rights reserved.
* The use and distribution terms for this software are covered by the
* Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
* which can be found in the file epl-v10.html at the root of this distribution.
* By using this software in any fashion, you are agreeing to be bound by
* the terms of this license.
* You must not remove this notice, or any other, from this software.
**/

package org.pih.warehouse.inventory

import grails.converters.JSON
import org.pih.warehouse.api.StockMovement
import org.pih.warehouse.api.StockMovementItem
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentCommand
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.importer.ImportDataCommand
import org.pih.warehouse.requisition.Requisition
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentStatusCode

class StockMovementController {

    def dataService
    def stockMovementService
    def requisitionService
    def shipmentService

    // This template is generated by webpack during application start
	def index = {
        redirect(action: "create", params:params)
	}

    def create = {
        render(template: "/common/react", params:params)
    }

    def show = {

        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)

        [stockMovement: stockMovement]

    }

    def list = {

        def max = params.max?params.max as int:10
        def offset = params.offset?params.offset as int:0
        User currentUser = User.get(session?.user?.id)
        Location currentLocation = Location.get(session?.warehouse?.id)

        if (params.direction=="OUTBOUND") {
            params.origin = params.origin?:currentLocation
            params.destination = params.destination?:null
        }
        else if (params.direction=="INBOUND") {
            params.origin = params.origin?:null
            params.destination = params.destination?:currentLocation
        }
        else {
            if (params.origin?.id == currentLocation?.id && params.destination?.id == currentLocation?.id) {
                params.direction = null
            }
            else if (params.origin?.id == currentLocation?.id) {
                params.direction = "OUTBOUND"
            }
            else if (params.destination?.id == currentLocation?.id) {
                params.direction = "INBOUND"
            }
            else {
                params.origin = params.origin ?: currentLocation
                params.destination = params.destination ?: currentLocation
            }
        }

        // Discard the requisition so it does not get saved at the end of the request
        Requisition requisition = new Requisition(params)
        requisition.discard()

        // Create stock movement to be used as search criteria
        StockMovement stockMovement = new StockMovement()
        if (params.q) {
            stockMovement.identifier = "%" + params.q + "%"
            stockMovement.name = "%" + params.q + "%"
            stockMovement.description = "%" + params.q + "%"
        }
        stockMovement.requestedBy = requisition.requestedBy
        stockMovement.origin = requisition.origin
        stockMovement.destination = requisition.destination
        stockMovement.statusCode = requisition?.status ? requisition?.status.toString() : null
        stockMovement.receiptStatusCode = params?.receiptStatusCode ? params.receiptStatusCode as ShipmentStatusCode : null

        def stockMovements = stockMovementService.getStockMovements(stockMovement, max, offset)
        def statistics = requisitionService.getRequisitionStatistics(requisition.origin, requisition.destination, currentUser)

        render(view:"list", params:params, model:[stockMovements: stockMovements, statistics:statistics])

    }

    def rollback = {
        try {
            stockMovementService.rollbackStockMovement(params.id)
            flash.message = "Successfully rolled back stock movement with ID ${params.id}"
        } catch (Exception e) {
            log.warn ("Unable to rollback stock movement with ID ${params.id}: " + e.message)
            flash.message = "Unable to rollback stock movement with ID ${params.id}: " + e.message
        }

        redirect(action: "show", id: params.id)
    }


    def delete = {

        try {
            StockMovement stockMovement = stockMovementService.getStockMovement(params.id)
            Requisition requisition = stockMovement?.requisition
            if (requisition) {
                def shipments = stockMovement?.requisition?.shipments
                shipments.toArray().each { Shipment shipment ->
                    requisition.removeFromShipments(shipment)
                    if (!shipment?.events?.empty) {
                        shipmentService.rollbackLastEvent(shipment)
                    }
                    shipmentService.deleteShipment(shipment)
                }
                //requisitionService.rollbackRequisition(requisition)
                requisitionService.deleteRequisition(requisition)
            }
            flash.message = "Successfully deleted stock movement with ID ${params.id}"
        } catch (Exception e) {
            log.error ("Unable to delete stock movement with ID ${params.id}: " + e.message, e)
            flash.message = "Unable to delete stock movement with ID ${params.id}: " + e.message
        }

        redirect(action: "list")
    }

    def requisition = {
        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)
        render(template: "requisition", model: [stockMovement:stockMovement])

    }

    def documents = {
        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)
        render(template: "documents", model: [stockMovement:stockMovement])

    }

    def packingList = {
        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)
        stockMovement.shipment = stockMovement?.requisition?.shipment
        render(template: "packingList", model: [stockMovement:stockMovement])
    }

    def receipts = {
        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)
        def shipments = Shipment.findAllByRequisition(stockMovement.requisition)
        def receiptItems = shipments*.receipts*.receiptItems?.flatten()
        render(template: "receipts", model: [receiptItems:receiptItems])
    }


    def uploadDocument = { DocumentCommand command ->
        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)

        Shipment shipment = stockMovement.shipment
        Document document = new Document()
        document.fileContents = command.fileContents.bytes
        document.contentType = command.fileContents.fileItem.contentType
        document.name = command.fileContents.fileItem.name
        document.filename = command.fileContents.fileItem.name
        document.documentType = DocumentType.get(9)

        shipment.addToDocuments(document)
        shipment.save()

        render ([data: "Document was uploaded successfully"] as JSON)
    }

	def exportCsv = {
        StockMovement stockMovement = stockMovementService.getStockMovement(params.id)

        // We need to create at least one row to ensure an empty template
        if (stockMovement?.lineItems?.empty) {
            stockMovement?.lineItems.add(new StockMovementItem())
        }

        def lineItems = stockMovement.lineItems.collect {
            [
                    requisitionItemId: it?.id?:"",
                    productCode: it?.product?.productCode?:"",
                    productName: it?.product?.name?:"",
                    palletName: it?.palletName?:"",
                    boxName: it?.boxName?:"",
                    lotNumber: it?.lotNumber?:"",
                    expirationDate: it?.expirationDate?it?.expirationDate?.format("MM/dd/yyyy"):"",
                    quantity: it?.quantityRequested?:"",
                    recipientId: it?.recipient?.id?:""
            ]
        }
        String csv = dataService.generateCsv(lineItems)
        response.setHeader("Content-disposition", "attachment; filename=\"StockMovementItems-${params.id}.csv\"")
        render(contentType:"text/csv", text: csv.toString(), encoding:"UTF-8")
	}


	def importCsv = { ImportDataCommand command ->

        try {
            StockMovement stockMovement = stockMovementService.getStockMovement(params.id)
            Requisition requisition = stockMovement.requisition

            def importFile = command.importFile
            if (importFile.isEmpty()) {
                throw new IllegalArgumentException("File cannot be empty")
            }

            if (importFile.fileItem.contentType != "text/csv") {
                throw new IllegalArgumentException("File must be in CSV format")
            }

            String csv = new String(importFile.bytes)
            def settings = [separatorChar: ',', skipLines: 1]
            csv.toCsvReader(settings).eachLine { tokens ->

                StockMovementItem stockMovementItem = StockMovementItem.createFromTokens(tokens)
                stockMovementItem.stockMovement = stockMovement
                stockMovement.lineItems.add(stockMovementItem)
            }
            stockMovementService.updateStockMovement(stockMovement, false)

        } catch (Exception e) {
            // FIXME The global error handler does not return JSON for multipart uploads
            log.warn("Error occurred while importing CSV: " + e.message, e)
            response.status = 500
            render([errorCode: 500, errorMessage: e?.message?:"An unknown error occurred during import"] as JSON)
            return
        }

        render([data: "Data will be imported successfully"] as JSON)
	}

}
