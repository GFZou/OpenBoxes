/**
* Copyright (c) 2012 Partners In Health.  All rights reserved.
* The use and distribution terms for this software are covered by the
* Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
* which can be found in the file epl-v10.html at the root of this distribution.
* By using this software in any fashion, you are agreeing to be bound by
* the terms of this license.
* You must not remove this notice, or any other, from this software.
**/ 
package org.pih.warehouse.requisition

import org.apache.commons.collections.FactoryUtils
import org.apache.commons.collections.list.LazyList
import grails.validation.Validateable

@Validateable(nullable = true)
class RequisitionItemListCommand implements Serializable {
		
	// Not the actual order items, but rather all the line items on the receive order page.  
	// This means that we might have more than one OrderItemCommand per OrderItem.
	def requestItems = 
		LazyList.decorate(new ArrayList(), FactoryUtils.instantiateFactory(RequisitionItemCommand.class));
	
	static constraints = {
		requestItems(validator: { val, obj, errors ->
			def errorsFound = false;
			val.each{ requestItem ->
				
				// Ignore a null order item
				if (requestItem) { 
					// If the quantity received is not null and the item does not validate, reject the 
					if(requestItem?.quantityReceived && !requestItem?.validate()) {
						requestItem.errors.allErrors.each { error ->
							println(">>>>>>>>>>>>> ERROR " + error.getCode() + " ")
							obj.errors.rejectValue("orderItems", error.getField() + "." + error.getCode())
							
						}
					}
				}
				return errorsFound;
			}
		});		
	}	
}

