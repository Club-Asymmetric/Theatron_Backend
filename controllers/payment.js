const Razorpay = require('razorpay');
const crypto = require('crypto');
const expressAsyncHandler = require('express-async-handler');
const { EVENTS, validateEventDetails } = require('../services/eventValidation');
const registrationStore = require('../services/registrationStore');
const { sendConfirmationEmail } = require('../services/email');

const REGISTRATION_AMOUNT = 9900;
const CURRENCY = 'INR';
const verificationLocks = new Map();

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function timingSafeEqualHex(left, right) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function participantsFrom(body) {
  const teamSize = Number(body.teamSize);
  if (!Number.isInteger(teamSize)) return [];
  return Array.from({ length: teamSize }, (_, index) => ({
    name: body[`participant${index + 1}Name`],
    phone: body[`participant${index + 1}Phone`],
  }));
}

const get_order = expressAsyncHandler(async (req, res) => {
  const { event, receipt } = req.body || {};
  if (!EVENTS.has(event)) return res.status(400).json({ error: 'Invalid event' });
  if (typeof receipt !== 'string' || !receipt.trim()) {
    return res.status(400).json({ error: 'receipt is required' });
  }

  const order = await getRazorpay().orders.create({
    amount: REGISTRATION_AMOUNT,
    currency: CURRENCY,
    receipt: receipt.trim(),
  });
  return res.json({
    id: order.id,
    amount: REGISTRATION_AMOUNT,
    currency: CURRENCY,
    receipt: order.receipt || receipt.trim(),
  });
});

const verify_payment = expressAsyncHandler(async (req, res) => {
  const body = req.body || {};
  const {
    event,
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: signature,
  } = body;

  const validationError = validateEventDetails(event, body);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!paymentId || !orderId || !signature) {
    return res.status(400).json({ error: 'Payment verification fields are required' });
  }

  const lockKey = `${paymentId}:${orderId}`;
  if (verificationLocks.has(lockKey)) return verificationLocks.get(lockKey);

  const operation = (async () => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(500).json({ error: 'Payment service is not configured' });

    const generatedSignature = crypto.createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (!timingSafeEqualHex(generatedSignature, signature)) {
      return res.status(401).json({ error: 'Payment verification failed' });
    }

    const razorpay = getRazorpay();
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId),
    ]);
    if (order.amount !== REGISTRATION_AMOUNT || order.currency !== CURRENCY
      || payment.order_id !== orderId || payment.amount !== REGISTRATION_AMOUNT
      || !['captured', 'authorized'].includes(payment.status)) {
      return res.status(401).json({ error: 'Payment amount or order mismatch' });
    }

    const registration = {
      registrationId: `reg_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`,
      createdAt: new Date().toISOString(),
      event,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      college: body.college.trim(),
      department: body.department.trim(),
      year: body.year.trim(),
      submissionLink: body.submissionLink,
      teamSize: body.teamSize,
      participants: participantsFrom(body),
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      amount: REGISTRATION_AMOUNT,
      paymentStatus: payment.status || 'captured',
    };
    const saved = await registrationStore.createRegistration(registration);
    if (saved.duplicate) return res.status(409).json({ error: 'Payment already registered' });

    try {
      await sendConfirmationEmail({ to: registration.email, name: registration.name, event });
      return res.status(201).json({
        success: true,
        registrationId: saved.registrationId,
        message: 'Registration confirmed',
      });
    } catch (error) {
      return res.status(201).json({
        success: true,
        registrationId: saved.registrationId,
        message: 'Registration confirmed, but confirmation email delivery failed',
        emailSent: false,
      });
    }
  })();

  verificationLocks.set(lockKey, operation);
  try {
    return await operation;
  } finally {
    verificationLocks.delete(lockKey);
  }
});

module.exports = { get_order, verify_payment, REGISTRATION_AMOUNT };
