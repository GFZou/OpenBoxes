<!--  Show recent shipments/receipts -->
<%@ page import="org.pih.warehouse.shipping.ShipmentStatusCode"%>
<div class="widget-small">
	<div class="widget-header"><h2><warehouse:message code="shipping.summary.label" args="[session.warehouse.name]"/></h2></div>
	<div class="widget-content">
		<div id="shippingsummary">
			<g:if test="${!outgoingShipmentsByStatus}">
				<div style="text-align: left; padding: 10px;" class="fade">
					(<warehouse:message code="shipping.noRecent.label"/>)
				</div>
			</g:if>	    		
			<g:else>			
	    		<table>
	    			<thead>
	    				<tr>
	    					<th colspan="2">
		    					<warehouse:message code="shipping.shipmentsTo.label" args="[session.warehouse.name]"/> 		
		    				</th>
	    				</tr>
	    			</thead>
	    			<tbody>
	    				<g:set var="pending" value="${ShipmentStatusCode.PENDING}"/>
	    				<g:set var="shipped" value="${ShipmentStatusCode.SHIPPED}"/>
	    				<g:set var="received" value="${ShipmentStatusCode.RECEIVED}"/>
						<g:set var="shipmentsPending" value="${outgoingShipmentsByStatus[pending] }"/>			
						<g:set var="shipmentsShipped" value="${outgoingShipmentsByStatus[shipped] }"/>		
						<g:set var="shipmentsEnroute" value="${incomingShipmentsByStatus[shipped] }"/>			
	    				<g:set var="shipmentsReceived" value="${incomingShipmentsByStatus[received] }"/>
						<g:set var="outgoingShipmentsTotal" value="${shipmentsPending.objectList.size + shipmentsShipped.objectList.size }"/>	
						<g:set var="incomingShipmentsTotal" value="${shipmentsEnroute.objectList.size + shipmentsReceived.objectList.size }"/>	
						<tr>
							<td>
								${warehouse.message(code: 'dashboard.incoming.shipped.label', args: [session.warehouse.name]) }							
							</td>
							<td style="text-align: right;">
								<g:link controller="shipment" action="list" params="['type':'incoming','status':shipped]">
									${shipmentsEnroute.objectList.size}
								</g:link>
							</td>
						</tr>				
						<tr>
							<td>
								${warehouse.message(code: 'dashboard.incoming.received.label', args: [session.warehouse.name]) }							
							</td>
							<td style="text-align: right;">
								<g:link controller="shipment" action="list" params="['type':'incoming','status':received]">
									${shipmentsReceived.objectList.size}
								</g:link>
							</td>
						</tr>							
							
			    	</tbody>
					<tfoot>
				    	<tr style="border-top: 1px solid lightgrey">
				    		<td style="text-align: left;">
				    			<span class="fade"><warehouse:message code="shipping.total.label"/></span>
				    		</td>
				    		<td style="text-align: right;">
				    			<g:link controller="shipment" action="list" params="[type:'outgoing']">
				    				${incomingShipmentsTotal}
					    		</g:link>
					    	</td>
				    	</tr>
			    	</tfoot>
			    	

		    	</table>
			</g:else>
		</div>
	</div>	    	
		    	
	<div class="widget-content">
		<div id="shippingsummary">
			<g:if test="${!outgoingShipmentsByStatus}">
				<div style="text-align: left; padding: 10px;" class="fade">
					(<warehouse:message code="shipping.noRecent.label"/>)
				</div>
			</g:if>	    		
			<g:else>					    	
		    	<table>
	    			<thead>
	    				<tr>
	    					<th colspan="2">
		    					<warehouse:message code="shipping.shipmentsFrom.label" args="[session.warehouse.name]"/> 		
		    				</th>
	    				</tr>
	    			</thead>
	    			<tbody>
						<tr>
							<td>
								${warehouse.message(code: 'dashboard.outgoing.pending.label', args: [session.warehouse.name]) }							
							</td>
							<td style="text-align: right;">
								<g:link controller="shipment" action="list" params="['type':'outgoing','status':pending]">
									${shipmentsPending.objectList.size}
								</g:link>
							</td>
						</tr>	
						<tr>
							<td>
								${warehouse.message(code: 'dashboard.outgoing.shipped.label', args: [session.warehouse.name]) }							
							</td>
							<td style="text-align: right;">
								<g:link controller="shipment" action="list" params="['type':'outgoing','status':shipped]">
									${shipmentsShipped.objectList.size}
								</g:link>
							</td>
						</tr>	
					</tbody>			
			    	<tfoot>
				    	<tr style="border-top: 1px solid lightgrey">
				    		<td style="text-align: left;">
				    			<span class="fade"><warehouse:message code="shipping.total.label"/></span>
				    		</td>
				    		<td style="text-align: right;">
				    			<g:link controller="shipment" action="list" params="[type:'outgoing']">
				    				${outgoingShipmentsTotal}
					    		</g:link>
					    	</td>
				    	</tr>
			    	</tfoot>
			    </table>
		    </g:else>
		</div>
	</div>	
	
	<br clear="all"/>
	
</div>