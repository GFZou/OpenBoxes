${warehouse.message(code: 'email.shipmentCreated.message', args: [format.metadata(obj:shipmentInstance.shipmentType), shipmentInstance?.name])}

<g:link controller="mobile" action="outboundDetails" id="${shipmentInstance?.requisition?.id}" absolute="${true}">Click for more details</g:link>
