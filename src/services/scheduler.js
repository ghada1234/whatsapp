const cron = require('node-cron');
const reminderService = require('./reminder.service');
const analyticsService = require('./analytics.service');
const logger = require('../utils/logger');
require('dotenv').config();

class Scheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    logger.info('🚀 Starting scheduler service...');

    // Job 1: Process reminders every day at 9 AM
    const reminderJob = cron.schedule('0 9 * * *', async () => {
      logger.info('⏰ Running daily reminder job');
      await reminderService.processPendingReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.push({ name: 'Daily Reminders', job: reminderJob });

    // Job 2: Update analytics summary every day at midnight
    const analyticsJob = cron.schedule('0 0 * * *', async () => {
      logger.info('📊 Running daily analytics update');
      await analyticsService.updateDailySummary();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.push({ name: 'Daily Analytics', job: analyticsJob });

    // Job 3: Process reminders every hour (for testing/immediate reminders)
    const hourlyReminderJob = cron.schedule('0 * * * *', async () => {
      logger.info('⏰ Running hourly reminder check');
      await reminderService.processPendingReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.push({ name: 'Hourly Reminder Check', job: hourlyReminderJob });

    logger.info(`✅ Scheduler started with ${this.jobs.length} jobs`);
    this.jobs.forEach(({ name }) => {
      logger.info(`  - ${name}`);
    });

    // Keep the process running
    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    logger.info('🛑 Stopping scheduler service...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`  - Stopped ${name}`);
    });
  }

  /**
   * Run a specific job manually
   */
  async runJob(jobName) {
    logger.info(`▶️  Manually running job: ${jobName}`);
    
    switch(jobName) {
      case 'reminders':
        await reminderService.processPendingReminders();
        break;
      case 'analytics':
        await analyticsService.updateDailySummary();
        break;
      default:
        logger.error(`Unknown job: ${jobName}`);
    }
  }
}

// If running directly, start the scheduler
if (require.main === module) {
  const scheduler = new Scheduler();
  scheduler.start();
  
  logger.info('Scheduler is running. Press Ctrl+C to stop.');
}

module.exports = new Scheduler();

