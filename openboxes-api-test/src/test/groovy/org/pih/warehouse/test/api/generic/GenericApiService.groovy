package org.pih.warehouse.test.api.generic

import io.restassured.path.json.JsonPath
import io.restassured.response.Response
import io.restassured.specification.RequestSpecification
import org.json.JSONObject

import org.pih.warehouse.test.api.base.ApiService
import org.pih.warehouse.test.util.generic.GenericResource

class GenericApiService extends ApiService {

    GenericApi genericApi

    private Map<GenericResource, List<String>> createdResources = [:].withDefault {[]}

    GenericApiService(RequestSpecification defaultRequestSpec) {
        super(defaultRequestSpec)

        genericApi = new GenericApi(defaultRequestSpec)
    }

    void cleanup() {
        createdResources.forEach { resourceType, resourceIds ->
            resourceIds.forEach { resourceId ->
                genericApi.delete(resourceType, resourceId, responseSpecUtil.OK_RESPONSE_SPEC)
            }
        }
    }

    JsonPath listOK(GenericResource resource) {
        return genericApi.list(resource, responseSpecUtil.OK_RESPONSE_SPEC).jsonPath()
    }

    JsonPath getOK(GenericResource resource, String id) {
        return genericApi.get(resource, id, responseSpecUtil.OK_RESPONSE_SPEC).jsonPath()
    }

    Response get404(GenericResource resource, String id) {
        return genericApi.get(resource, id, responseSpecUtil.NOT_FOUND_RESPONSE_SPEC)
    }

    String createOK(GenericResource resource, JSONObject body) {
        JsonPath json = genericApi.create(resource, body.toString(), responseSpecUtil.CREATED_RESPONSE_SPEC).jsonPath()

        // TODO: This fails because we're not returning the id of the created object. Change the generic API to
        //       return the id so we use it in our tests and delete by id in cleanup.
        String id = json.getString(resource.idField)
        // createdResources.get(resource).add(id)

        return id
    }

    JsonPath updateOK(GenericResource resource, String id, JSONObject body) {
        return genericApi.update(resource, id, body.toString(), responseSpecUtil.OK_RESPONSE_SPEC).jsonPath()
    }

    Response deleteOK(GenericResource resource, String id) {
        Response response = genericApi.delete(resource, id, responseSpecUtil.NO_CONTENT_RESPONSE_SPEC)

        createdResources.get(resource).remove(id)

        return response
    }
}
