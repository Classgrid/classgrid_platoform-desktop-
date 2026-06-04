import axios from 'axios';

/**
 * Classgrid SMS Service
 * Uses Fast2SMS API to deliver low-latency OTPs for admission verification.
 */

// We pull the API key from the environment variables (.env)
const getApiKey = () => process.env.FAST2SMS_API_KEY;

/**
 * Sends a generic transactional SMS.
 * 
 * @param {string} phoneNumber - Full 10-digit Indian mobile number
 * @param {string} message - The text body to send (max 160 chars for 1 credit)
 * @returns {Promise<Object>} API response detailing success or failure
 */
export const sendSMS = async (phoneNumber, message) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('⚠️ FAST2SMS_API_KEY is not configured in .env. SMS will not be sent.');
        return { success: false, error: 'API key not configured' };
    }

    try {
        const response = await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
                route: 'q',
                numbers: phoneNumber,
                message: message,
                flash: 0 // Normal SMS (not flash)
            },
            {
                headers: {
                    'authorization': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.return === true) {
            console.log(`✅ SMS successfully delivered to ${phoneNumber}`);
            return { success: true, data: response.data };
        } else {
            console.error('❌ Fast2SMS API error:', response.data);
            return { success: false, error: response.data.message || 'Unknown Fast2SMS error' };
        }
    } catch (error) {
        console.error('❌ SMS transmission failed:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.message || error.message 
        };
    }
};

/**
 * Convenience method specifically for generating and sending a 6-digit OTP
 * @param {string} phoneNumber 
 * @returns {Promise<Object>} { success: true, otp: "123456" }
 */
export const sendOTP = async (phoneNumber) => {
    // Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const message = `Your Classgrid Verification OTP is ${otp}. Do not share this code with anyone.`;
    
    const result = await sendSMS(phoneNumber, message);
    
    if (result.success) {
        // Return both success and the generated OTP so the route controller can save it to Redis/MongoDB
        return { success: true, otp };
    }
    return result;
};
