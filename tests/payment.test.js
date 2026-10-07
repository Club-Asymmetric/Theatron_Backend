jest.mock('razorpay', () => jest.fn());
jest.mock('../services/registrationStore', () => ({
  createRegistration: jest.fn(),
}));
jest.mock('../services/email', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}));

const crypto = require('crypto');
const request = require('supertest');
const Razorpay = require('razorpay');
const registrationStore = require('../services/registrationStore');
const app = require('../server');

const secret = 'test-secret';
const validDetails = {
  event: 'quizcorn',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+919876543210',
  college: 'CIT',
  department: 'CSE',
  year: '3',
};

beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = 'test-key';
  process.env.RAZORPAY_KEY_SECRET = secret;
  registrationStore.createRegistration.mockResolvedValue({
    duplicate: false,
    registrationId: 'reg_test',
  });
  Razorpay.mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test',
        amount: 9900,
        currency: 'INR',
        receipt: 'quizcorn_1',
      }),
      fetch: jest.fn().mockResolvedValue({
        amount: 9900,
        currency: 'INR',
      }),
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({
        order_id: 'order_test',
        amount: 9900,
        status: 'captured',
      }),
    },
  }));
});

function signature(orderId = 'order_test', paymentId = 'payment_test') {
  return crypto.createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

test('creates an order with a fixed amount', async () => {
  const response = await request(app).post('/payment/get_order').send({
    event: 'quizcorn',
    amount: 1,
    currency: 'INR',
    receipt: 'quizcorn_1',
  });
  expect(response.status).toBe(200);
  expect(response.body.amount).toBe(9900);
});

test('rejects invalid event and contact fields', async () => {
  const invalidEvent = await request(app).post('/payment/get_order')
    .send({ event: 'unknown', receipt: 'x' });
  expect(invalidEvent.status).toBe(400);

  const invalidDetails = await request(app).post('/payment/verify')
    .send({ ...validDetails, email: 'bad', phone: 'abc' });
  expect(invalidDetails.status).toBe(400);
});

test('rejects invalid team size', async () => {
  const response = await request(app).post('/payment/verify').send({
    ...validDetails,
    event: 'stage-play',
    teamSize: 1,
  });
  expect(response.status).toBe(400);
});

test('rejects invalid signatures without saving', async () => {
  const response = await request(app).post('/payment/verify').send({
    ...validDetails,
    razorpay_payment_id: 'payment_test',
    razorpay_order_id: 'order_test',
    razorpay_signature: '00',
  });
  expect(response.status).toBe(401);
  expect(registrationStore.createRegistration).not.toHaveBeenCalled();
});

test('verifies payment and saves once', async () => {
  const payload = {
    ...validDetails,
    razorpay_payment_id: 'payment_test',
    razorpay_order_id: 'order_test',
    razorpay_signature: signature(),
  };
  const response = await request(app).post('/payment/verify').send(payload);
  expect(response.status).toBe(201);
  expect(response.body.registrationId).toBe('reg_test');

  registrationStore.createRegistration.mockResolvedValueOnce({
    duplicate: true,
    registrationId: 'reg_test',
  });
  const duplicate = await request(app).post('/payment/verify').send(payload);
  expect(duplicate.status).toBe(409);
});
