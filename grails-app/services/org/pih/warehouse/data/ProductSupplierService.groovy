/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.data

import grails.core.GrailsApplication
import grails.gorm.transactions.Transactional
import groovy.sql.Sql
import org.pih.warehouse.core.Organization
import org.pih.warehouse.core.PreferenceType
import org.pih.warehouse.core.ProductPrice
import org.pih.warehouse.core.RatingTypeCode
import org.pih.warehouse.core.UnitOfMeasure
import org.pih.warehouse.importer.ImportDataCommand
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductPackage
import org.pih.warehouse.product.ProductSupplier
import org.pih.warehouse.product.ProductSupplierPreference
import util.ConfigHelper

import java.text.SimpleDateFormat

@Transactional
class ProductSupplierService {

    def identifierService
    def dataSource

    ProductSupplier createOrUpdate(Map params) {
        log.info("params: ${params}")

        def productCode = params.productCode
        def supplierName = params.supplierName
        def manufacturerName = params.manufacturerName
        def ratingTypeCode = params?.ratingTypeCode ? params?.ratingTypeCode?.toUpperCase() as RatingTypeCode : null
        def supplierCode = params.supplierCode
        def manufacturerCode = params.manufacturerCode

        Product product = productCode ? Product.findByProductCode(productCode) : null
        UnitOfMeasure unitOfMeasure = params.defaultProductPackageUomCode ?
                UnitOfMeasure.findByCode(params.defaultProductPackageUomCode) : null
        BigDecimal price = params.defaultProductPackagePrice ?
                new BigDecimal(params.defaultProductPackagePrice) : null
        Integer quantity = params.defaultProductPackageQuantity as Integer

        ProductSupplier productSupplier = ProductSupplier.findByIdOrCode(params["id"], params["code"])
        if (!productSupplier) {
            productSupplier = new ProductSupplier(params)
        } else {
            productSupplier.properties = params
        }

        productSupplier.ratingTypeCode = ratingTypeCode
        productSupplier.productCode = params["legacyProductCode"]
        productSupplier.product = product
        productSupplier.supplier = supplierName ? Organization.findByName(supplierName) : null
        productSupplier.manufacturer = manufacturerName ? Organization.findByName(manufacturerName) : null
        productSupplier.supplierCode = supplierCode ? supplierCode : null
        productSupplier.manufacturerCode = manufacturerCode ? manufacturerCode : null

        if (unitOfMeasure && quantity) {
            ProductPackage defaultProductPackage =
                    productSupplier.productPackages.find { it.uom == unitOfMeasure && it.quantity == quantity }

            if (!defaultProductPackage) {
                defaultProductPackage = new ProductPackage()
                defaultProductPackage.name = "${unitOfMeasure.code}/${quantity}"
                defaultProductPackage.description = "${unitOfMeasure.name} of ${quantity}"
                defaultProductPackage.product = productSupplier.product
                defaultProductPackage.uom = unitOfMeasure
                defaultProductPackage.quantity = quantity
                if (price != null) {
                    ProductPrice productPrice = new ProductPrice()
                    productPrice.price = price
                    defaultProductPackage.productPrice = productPrice
                }
                productSupplier.addToProductPackages(defaultProductPackage)
            } else if (price != null && !defaultProductPackage.productPrice) {
                ProductPrice productPrice = new ProductPrice()
                productPrice.price = price
                defaultProductPackage.productPrice = productPrice
            } else if (price != null && defaultProductPackage.productPrice) {
                defaultProductPackage.productPrice.price = price
                defaultProductPackage.lastUpdated = new Date()
            }
        }

        def dateFormat = new SimpleDateFormat("MM/dd/yyyy")

        def contractPriceValidUntil = params.contractPriceValidUntil ? dateFormat.parse(params.contractPriceValidUntil) : null
        BigDecimal contractPricePrice = params.contractPricePrice ? new BigDecimal(params.contractPricePrice) : null

        if (contractPricePrice) {
            if (!productSupplier.contractPrice) {
                productSupplier.contractPrice = new ProductPrice()
            }

            productSupplier.contractPrice.price = contractPricePrice

            if (contractPriceValidUntil) {
                productSupplier.contractPrice.toDate = contractPriceValidUntil
            }
        }

        PreferenceType preferenceType = params.globalPreferenceTypeName ? PreferenceType.findByName(params.globalPreferenceTypeName) : null

        if (preferenceType) {
            ProductSupplierPreference productSupplierPreference = productSupplier.getGlobalProductSupplierPreference()

            if (!productSupplierPreference) {
                productSupplierPreference = new ProductSupplierPreference()
                productSupplier.addToProductSupplierPreferences(productSupplierPreference)
            }

            productSupplierPreference.preferenceType = preferenceType
            productSupplierPreference.comments = params.globalPreferenceTypeComments

            def globalPreferenceTypeValidityStartDate = params.globalPreferenceTypeValidityStartDate ? dateFormat.parse(params.globalPreferenceTypeValidityStartDate) : null

            if (globalPreferenceTypeValidityStartDate) {
                productSupplierPreference.validityStartDate = globalPreferenceTypeValidityStartDate
            }

            def globalPreferenceTypeValidityEndDate = params.globalPreferenceTypeValidityEndDate ? dateFormat.parse(params.globalPreferenceTypeValidityEndDate) : null

            if (globalPreferenceTypeValidityEndDate) {
                productSupplierPreference.validityEndDate = globalPreferenceTypeValidityEndDate
            }
        }

        if (!productSupplier.code) {
            String prefix = productSupplier?.product?.productCode
            productSupplier.code = identifierService.generateProductSupplierIdentifier(prefix)
        }
        return productSupplier
    }

    def getOrCreateNew(Map params, boolean forceCreate) {
        def productSupplier
        if (params.productSupplier) {
            productSupplier = params.productSupplier ? ProductSupplier.get(params.productSupplier) : null
        } else {
            productSupplier = getProductSupplier(params)
        }

        if (!productSupplier && (params.supplierCode || params.manufacturer || params.manufacturerCode || forceCreate)) {
            return createProductSupplierWithoutPackage(params)
        }

        return productSupplier
    }

    def getProductSupplier(Map params) {
        String supplierCode = params.supplierCode ? params.supplierCode.replaceAll('[ .,-]','') : null
        String manufacturerCode = params.manufacturerCode ? params.manufacturerCode.replaceAll('[ .,-]','') : null

        String query = """
                select 
                    id
                FROM product_supplier_clean
                WHERE product_id = :productId
                AND supplier_id = :supplierId 
                """
        if (params.supplierCode) {
            query += " AND supplier_code = IFNULL(:supplierCode, supplier_code) "
        } else {
            query += " AND (supplier_code is null OR supplier_code = '') "
            if (params.manufacturer && params.manufacturerCode) {
                query += " AND manufacturer_id = :manufacturerId AND manufacturer_code = :manufacturerCode "
            } else if (params.manufacturer) {
                query += " AND manufacturer_id = :manufacturerId AND (manufacturer_code is null OR manufacturer_code = '')"
            } else if (params.manufacturerCode) {
                query += " AND manufacturer_code = :manufacturerCode AND (manufacturer_id is null or manufacturer_id = '')"
            } else {
                query += " AND (manufacturer_code is null OR manufacturer_code = '') AND (manufacturer_id is null or manufacturer_id = '')"
            }
        }
        Sql sql = new Sql(dataSource)
        def data = sql.rows(query, [
                'productId': params.product?.id,
                'supplierId': params.supplier?.id,
                'manufacturerId': params.manufacturer,
                'manufacturerCode': manufacturerCode,
                'supplierCode': supplierCode,
        ])
        // Sort productSuppliers by active field, so we make sure that if there is more than one and one of then could be inactive, that the active ones are "moved" to the top of list
        ArrayList<ProductSupplier> productSuppliers = data?.collect{ it -> ProductSupplier.get(it?.id) }?.sort{ !it?.active }
        // Double negation below is equivalent to productSuppliers.size() > 0 ? productSuppliers.first() : null (empty list is treated as true, so we can't do "productSuppliers ?")
        def productSupplier = !!productSuppliers ? productSuppliers?.first() : null
        return productSupplier
    }

    def createProductSupplierWithoutPackage(Map params) {
        Product product = Product.get(params.product.id)
        Organization organization = Organization.get(params.supplier.id)
        Organization manufacturer = Organization.get(params.manufacturer)
        ProductSupplier productSupplier = new ProductSupplier()
        productSupplier.code = params.sourceCode ?: identifierService.generateProductSupplierIdentifier(product?.productCode, organization?.code)
        productSupplier.name = params.sourceName ?: product?.name
        productSupplier.supplier = organization
        productSupplier.supplierCode = params.supplierCode
        productSupplier.product = product
        productSupplier.manufacturer = manufacturer
        productSupplier.manufacturerCode = params.manufacturerCode

        if (productSupplier.validate()) {
            productSupplier.save(failOnError: true)
        }
        return productSupplier
    }
}