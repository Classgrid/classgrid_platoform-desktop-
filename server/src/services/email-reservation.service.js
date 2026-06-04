import EmailReservation from '../models/EmailReservation.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Reuse the same queue name as the worker
const provisioningQueue = new Queue('EmailProvisioningQueue', { connection });

/**
 * Reserve an institutional email address and enqueue a provisioning job.
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.email - The requested email (e.g., student@pccoe.classgrid.in)
 * @param {string} params.provider - google_workspace | zoho | internal
 * @param {string} params.intendedUserId - User ID this email is for
 * @param {string} params.password - Initial password for the new email
 */
export const reserveAndProvisionEmail = async ({
  organizationId,
  email,
  provider = 'internal',
  intendedUserId = null,
  password = null
}) => {
  try {
    // 1. Atomic Reservation in MongoDB
    // The unique index on `reserved_email` in EmailReservation model 
    // ensures two users never get the same email during a race condition.
    const reservation = new EmailReservation({
      organization_id: organizationId,
      reserved_email: email.toLowerCase().trim(),
      intended_user: intendedUserId,
      provider,
      status: 'pending'
    });

    await reservation.save();

    // 2. Enqueue Background Provisioning Job
    await provisioningQueue.add(
      'provision-email',
      {
        reservationId: reservation._id,
        provider,
        requestedEmail: email,
        password: password,
        organizationId: organizationId
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s, 10s, 20s
        }
      }
    );

    return { success: true, reservationId: reservation._id };
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('This email address has already been reserved or exists.');
    }
    console.error('Email reservation error:', error.message);
    throw error;
  }
};

export default { reserveAndProvisionEmail };
