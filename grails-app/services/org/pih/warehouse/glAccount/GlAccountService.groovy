/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.glAccount

import grails.gorm.transactions.Transactional
import org.pih.warehouse.core.GlAccount

@Transactional
class GlAccountService {

    GlAccount saveGlAccount(GlAccount glAccount) {
        glAccount.save(failOnError: true)
    }

    void deleteGlAccount(GlAccount glAccount) {
        glAccount.delete()
    }

    List<GlAccount> getGlAccounts (Map params) {
        def max = params.max ? params.int("max") : null
        def offset = params.offset ? params.int("offset") : null

        return GlAccount.createCriteria().list(max: max, offset: offset) {
            if (params.active != null) {
                eq("active", params.active?.toBoolean())
            }
        }
    }
}
