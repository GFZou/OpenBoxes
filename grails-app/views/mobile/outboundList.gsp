<%@ page contentType="text/html;charset=UTF-8" %>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="layout" content="mobile" />
    <title><warehouse:message code="stockMovements.outbound.label" default="Stock Movements (Outbound)"/></title>
</head>

<body>

    <div class="row g-0">
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th><g:message code="stockMovement.status.label"/></th>
                    <th><g:message code="stockMovement.identifier.label"/></th>
                    <th><g:message code="stockMovement.destination.label"/></th>
                    <th><g:message code="stockMovement.requestedDeliveryDate.label" default="Requested Delivery Date"/></th>
                    <th><g:message code="react.stockMovement.expectedDeliveryDate.label" default="Requested Delivery Date"/></th>
                    <th><g:message code="default.actions.label"/></th>
                </tr>
            </thead>
            <tbody>
            <g:each var="stockMovement" in="${stockMovements}">
                <tr>
                    <td>
                        <a href="${createLink(controller: 'stockMovement', action: 'show', id: stockMovement?.id)}" class="text-decoration-none text-reset">
                            <g:if test="${stockMovement?.shipment?.currentEvent}">
                                <div class="badge bg-primary">${stockMovement.shipment?.currentEvent?.eventType?.eventCode}</div>
                                <div>
                                    <small><g:formatDate date="${stockMovement.shipment?.currentEvent?.eventDate}" format="MMM dd hh:mm a"/></small>
                                </div>
                            </g:if>
                            <g:else>
                                <div class="badge bg-primary">${stockMovement?.status}</div>
                            </g:else>
                        </a>
                    </td>
                    <td>
                        <a href="${createLink(controller: 'mobile', action: 'outboundDetails', id: stockMovement?.id)}" class="text-decoration-none text-reset">
                            ${stockMovement.identifier}
                        </a>
                    </td>
                    <td>
                        ${stockMovement?.destination?.name} ${stockMovement?.destination?.locationNumber}
                    </td>
                    <td>
                        <g:formatDate date="${stockMovement?.requisition?.requestedDeliveryDate}" format="dd MMM yyyy"/>
                    </td>
                    <td>
                        <g:formatDate date="${stockMovement?.expectedDeliveryDate}" format="dd MMM yyyy"/>
                    </td>
                    <td>
                        <a href="${createLink(controller: 'mobile', action: 'outboundDetails', id: stockMovement?.id)}" class="btn btn-link">

                            <button class="btn btn-outline-primary">Details</button>

                        </a>
                    </td>
                </tr>
            </g:each>
            </tbody>
        </table>
        <div class="pagination">
            <g:paginate total="${stockMovements.totalCount}"/>
        </div>
    </div>
</body>
</html>
