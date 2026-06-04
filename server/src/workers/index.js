import './email-provisioning.worker.js';

// Import other workers here as they are created
import './chat-persistence.worker.js';
import './attendance.worker.js';
import { initCronJobs } from './cleanup.worker.js';
import { initAdmissionCronJobs } from './admission-deadline-checker.cron.js';
import { initPromotionSchedulerCron } from './promotion-scheduler.cron.js';

initCronJobs();
initAdmissionCronJobs();
initPromotionSchedulerCron();
// import './analytics.worker.js';

console.log('👷 Background Workers Initialized');
