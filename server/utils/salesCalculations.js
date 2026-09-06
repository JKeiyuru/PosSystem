// server/utils/salesCalculations.js
// SINGLE SOURCE OF TRUTH for daily/period sales & revenue calculations.
//
// Rules enforced here:
//  1. Money is only counted as revenue when it is ACTUALLY RECEIVED.
//  2. A sale's money is attributed to the real payment method(s) used —
//     split payments are broken down per method, never lumped into the
//     "primary" method.
//  3. The "credit" portion of any sale is NEVER money received. It becomes
//     revenue only when the customer pays (PaymentTransaction).
//  4. Total sales (turnover) = value of everything sold, credit included.
//     Total collected  = cash + digital + credit repayments.

export const CASH_METHODS = ['cash'];

export const DIGITAL_METHODS = [
  'mpesa_paybill',
  'mpesa_till',
  'gdc_paybill',
  'mpesa_beth',
  'mpesa_martin',
];

export const PAYMENT_METHODS = [...CASH_METHODS, ...DIGITAL_METHODS, 'credit'];

export const isCashMethod = (method) => CASH_METHODS.includes(method);
export const isDigitalMethod = (method) => DIGITAL_METHODS.includes(method);

const num = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const round2 = (value) => Math.round(num(value) * 100) / 100;

/**
 * Normalise the payment lines of a sale into an array of
 * { method, amount } entries covering ONLY money actually received.
 *
 * Works for legacy sales that have no splitPayments array.
 */
export function getSalePaymentLines(sale) {
  if (!sale) return [];

  const splits = Array.isArray(sale.splitPayments) ? sale.splitPayments : [];
  const received = splits
    .filter((p) => p && p.method && p.method !== 'credit' && num(p.amount) > 0)
    .map((p) => ({ method: p.method, amount: num(p.amount) }));

  if (received.length > 0) return received;

  // Legacy / single-method sales.
  const amountPaid = num(sale.amountPaid);
  if (amountPaid <= 0) return [];

  if (sale.paymentMethod && sale.paymentMethod !== 'credit') {
    return [{ method: sale.paymentMethod, amount: amountPaid }];
  }

  // A "credit" sale that still recorded a deposit: the money was received,
  // we just don't know the tender. Attribute it to cash (best available guess)
  // so the day's total is never understated.
  return [{ method: 'cash', amount: amountPaid }];
}

/** Amount of a sale that was actually paid at any point (all methods). */
export const getSaleAmountReceived = (sale) =>
  round2(getSalePaymentLines(sale).reduce((sum, line) => sum + line.amount, 0));

/** Amount of a sale still owed. */
export const getSaleAmountDue = (sale) =>
  Math.max(0, round2(num(sale?.total) - num(sale?.amountPaid)));

/**
 * Full breakdown for a set of sales + credit repayments.
 *
 * @param {Array} sales    Sale documents in the period.
 * @param {Array} payments PaymentTransaction documents in the period.
 */
export function calculateSalesBreakdown(sales = [], payments = []) {
  const byMethod = {};
  PAYMENT_METHODS.forEach((m) => {
    byMethod[m] = 0;
  });

  let grossSalesValue = 0; // everything sold (turnover), credit included
  let saleCashCollected = 0;
  let saleDigitalCollected = 0;
  let creditIssued = 0; // new debt created in the period
  let totalCost = 0;
  let grossProfit = 0;
  let discounts = 0;
  let transport = 0;

  for (const sale of sales) {
    grossSalesValue += num(sale.total);
    totalCost += num(sale.totalCost);
    grossProfit += num(sale.grossProfit);
    discounts += num(sale.discount);
    transport += num(sale.transport);

    for (const line of getSalePaymentLines(sale)) {
      byMethod[line.method] = (byMethod[line.method] || 0) + line.amount;
      if (isCashMethod(line.method)) saleCashCollected += line.amount;
      else saleDigitalCollected += line.amount;
    }

    creditIssued += getSaleAmountDue(sale);
  }

  // Credit repayments received in the period (real money in, from old debt).
  let creditPaymentsCash = 0;
  let creditPaymentsDigital = 0;

  for (const payment of payments) {
    const amount = num(payment.amount);
    if (amount <= 0) continue;
    const method = payment.paymentMethod || 'cash';
    byMethod[method] = (byMethod[method] || 0) + amount;
    if (isCashMethod(method)) creditPaymentsCash += amount;
    else creditPaymentsDigital += amount;
  }

  const totalCash = saleCashCollected + creditPaymentsCash;
  const totalDigital = saleDigitalCollected + creditPaymentsDigital;
  const creditPaymentsCollected = creditPaymentsCash + creditPaymentsDigital;
  const totalCollected = totalCash + totalDigital;

  const methodTotals = {};
  Object.keys(byMethod).forEach((m) => {
    methodTotals[m] = round2(byMethod[m]);
  });

  return {
    // Turnover
    grossSalesValue: round2(grossSalesValue),

    // Money received
    totalCollected: round2(totalCollected),
    totalCash: round2(totalCash),
    totalDigital: round2(totalDigital),

    // From sales made in the period
    saleCashCollected: round2(saleCashCollected),
    saleDigitalCollected: round2(saleDigitalCollected),

    // From debt repayments in the period
    creditPaymentsCollected: round2(creditPaymentsCollected),
    creditPaymentsCash: round2(creditPaymentsCash),
    creditPaymentsDigital: round2(creditPaymentsDigital),

    // New credit given in the period (not money)
    creditIssued: round2(creditIssued),

    // Per-method detail (cash, mpesa_*, gdc_paybill)
    methodTotals,
    totalMpesaPaybill: methodTotals['mpesa_paybill'] || 0,
    totalMpesaTill: methodTotals['mpesa_till'] || 0,
    totalMpesaBeth: methodTotals['mpesa_beth'] || 0,
    totalMpesaMartin: methodTotals['mpesa_martin'] || 0,
    totalGdcPaybill: methodTotals['gdc_paybill'] || 0,

    // Costs & profit
    totalCost: round2(totalCost),
    grossProfit: round2(grossProfit),
    discounts: round2(discounts),
    transport: round2(transport),

    // Counts
    salesCount: sales.length,
    paymentsCount: payments.length,
  };
}

/** Start/end of the day containing `date`. */
export function getDayRange(date = new Date()) {
  const target = new Date(date);
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(num(amount));
}
