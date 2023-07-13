package org.pih.warehouse.jobs

import org.quartz.JobExecutionContext

class RefreshDemandDataJob extends SessionlessJob {

    def reportService

    static concurrent = false

    static triggers = {
        cron name: JobUtils.getCronName(RefreshDemandDataJob),
            cronExpression: JobUtils.getCronExpression(RefreshDemandDataJob)
    }

    void execute(JobExecutionContext context) {
        if (JobUtils.shouldExecute(RefreshDemandDataJob)) {
            def startTime = System.currentTimeMillis()
            log.info("Refreshing demand data: " + context.mergedJobDataMap)
            reportService.refreshProductDemandData()
            log.info "Finished refreshing demand data in " + (System.currentTimeMillis() - startTime) + " ms"
        }
    }
}
