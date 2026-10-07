import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'unconfigured',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'unconfigured',
});

export const isRazorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
