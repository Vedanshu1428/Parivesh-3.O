"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSLAEscalations = void 0;
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
const auditChain_1 = require("../services/auditChain");
// import cron from 'node-cron';
/**
 * STUB: SLA Escalation Cron Job
 *
 * In a real environment, use node-cron:
 * cron.schedule('0 0 * * *', async () => { ... });
 *
 * Logic:
 * Checks for applications sitting in 'SUBMITTED' or 'UNDER_SCRUTINY'
 * for more than 30 days and automatically raises a flag or escalates.
 */
const checkSLAEscalations = async () => {
    logger_1.logger.info('Running SLA Escalation Check Job...');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const overdueApplications = await prisma_1.prisma.application.findMany({
            where: {
                status: { in: ['SUBMITTED', 'UNDER_SCRUTINY'] },
                updatedAt: { lt: thirtyDaysAgo }
            }
        });
        if (overdueApplications.length > 0) {
            logger_1.logger.warn(`Found ${overdueApplications.length} overdue applications. Triggering escalations.`);
            for (const app of overdueApplications) {
                // e.g. Notify senior officers, update internal escalation flag, etc.
                // Creating an audit log entry for the system action
                await auditChain_1.auditChainService.log({
                    eventType: 'SYSTEM_ESCALATION',
                    actorId: 'SYSTEM',
                    applicationId: app.id,
                    payload: {
                        message: 'SLA threshold (30 days) exceeded in current status',
                        previousStatus: app.status
                    }
                });
            }
        }
        else {
            logger_1.logger.info('No overdue applications found.');
        }
    }
    catch (error) {
        logger_1.logger.error('Error in checkSLAEscalations cron job:', error);
    }
};
exports.checkSLAEscalations = checkSLAEscalations;
//# sourceMappingURL=slaCron.js.map