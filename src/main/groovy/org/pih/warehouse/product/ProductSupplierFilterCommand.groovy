package org.pih.warehouse.product

import grails.validation.Validateable
import org.pih.warehouse.api.PaginationCommand

class ProductSupplierFilterCommand extends PaginationCommand implements Validateable {

    String product

    String supplier

    String preferenceType

    Date createdFrom

    Date createdTo

    Boolean includeInactive

    String searchTerm

    String sort

    String order


    static constraints = {
        product nullable: true
        supplier nullable: true
        preferenceType nullable: true
        createdFrom nullable: true
        createdTo nullable: true
        includeInactive nullable: true
        searchTerm nullable: true
        sort nullable: true
        order nullable: true
    }
}
