import './email-provisioning.worker.js';

// Import other workers here as they are created
import './chat-persistence.worker.js';
import './attendance.worker.js';
import { initCronJobs } from './cleanup.worker.js';
import { initAdmissionCronJobs } from './admission-deadline-checker.cron.js';
import { initPromotionSchedulerCron } from './promotion-scheduler.cron.js';
import { initScheduledNotificationWorker } from './scheduled-notification.worker.js';
import { initChatSchedulerCron } from './chat-scheduler.worker.js';

initCronJobs();
initAdmissionCronJobs();
initPromotionSchedulerCron();
initScheduledNotificationWorker();
initChatSchedulerCron();
// import './analytics.worker.js';

console.log('👷 Background Workers Initialized');
