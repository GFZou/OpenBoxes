package org.pih.warehouse.test.api.product

import groovy.transform.InheritConstructors
import io.restassured.builder.RequestSpecBuilder
import io.restassured.http.Method
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import io.restassured.specification.ResponseSpecification

import org.pih.warehouse.test.api.base.Api

@InheritConstructors
class ProductApi extends Api {

    Response list(ResponseSpecification responseSpec) {
        return request(null, responseSpec, Method.GET, "/api/products")
    }

    Response getDemand(String productId, ResponseSpecification responseSpec) {
        RequestSpecification requestSpec = new RequestSpecBuilder()
                .addPathParam("productId", productId)
                .build()

        return request(requestSpec, responseSpec, Method.GET, "/api/products/{productId}/demand")
    }

    Response getDemandSummary(String productId, ResponseSpecification responseSpec) {
        RequestSpecification requestSpec = new RequestSpecBuilder()
                .addPathParam("productId", productId)
                .build()

        return request(requestSpec, responseSpec, Method.GET, "/api/products/{productId}/demandSummary")
    }

    Response getProductSummary(String productId, ResponseSpecification responseSpec) {
        RequestSpecification requestSpec = new RequestSpecBuilder()
                .addPathParam("productId", productId)
                .build()

        return request(requestSpec, responseSpec, Method.GET, "/api/products/{productId}/productSummary")
    }
}
