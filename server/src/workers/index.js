import './email-provisioning.worker.js';

// Import other workers here as they are created
import './chat-persistence.worker.js';
import './attendance.worker.js';
import { initCronJobs } from './cleanup.worker.js';
import { initAdmissionCronJobs } from './admission-deadline-checker.cron.js';
import { initPromotionSchedulerCron } from './promotion-scheduler.cron.js';
import { initScheduledNotificationWorker } from './scheduled-notification.worker.js';
import { initOrganizationUsageDailyWorker } from './organization-usage-daily.worker.js';
import { initMonthlyInvoiceWorker } from './monthly-invoice.worker.js';

initCronJobs();
initAdmissionCronJobs();
initPromotionSchedulerCron();
initScheduledNotificationWorker();
initOrganizationUsageDailyWorker();
initMonthlyInvoiceWorker();
// import './analytics.worker.js';

console.log('👷 Background Workers Initialized');
