// server/scripts/backfillSalePayments.js
//
// One-off maintenance script:
//   1. Populates `amountPaidAtSale` on historical sales (the deposit actually
//      taken at the till, excluding later debt repayments).
//   2. Re-syncs every customer's `currentCredit` from the sales ledger.
//
// Usage:  node scripts/backfillSalePayments.js
//         node scripts/backfillSalePayments.js --dry-run

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sale from '../models/Sale.model.js';
import Customer from '../models/Customer.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const connect = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI is not set in the environment');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
};

const run = async () => {
  await connect();

  // ── Map: saleId -> total applied through debt repayments ───────────
  const payments = await PaymentTransaction.find({});
  const appliedBySale = {};
  for (const payment of payments) {
    for (const applied of payment.sales || []) {
      if (!applied?.sale) continue;
      const key = applied.sale.toString();
      appliedBySale[key] = round2(
        (appliedBySale[key] || 0) + (applied.amountApplied || 0)
      );
    }
  }

  // ── 1. Backfill amountPaidAtSale ───────────────────────────────────
  const sales = await Sale.find({
    $or: [{ amountPaidAtSale: { $exists: false } }, { amountPaidAtSale: null }],
  });

  console.log(`🔎 ${sales.length} sale(s) missing amountPaidAtSale`);

  let updated = 0;
  for (const sale of sales) {
    const laterPayments = appliedBySale[sale._id.toString()] || 0;

    // Prefer the split-payment ledger (never counts credit as money in).
    let deposit;
    if (Array.isArray(sale.splitPayments) && sale.splitPayments.length > 0) {
      deposit = round2(
        sale.splitPayments
          .filter((p) => p.method !== 'credit')
          .reduce((sum, p) => sum + (p.amount || 0), 0)
      );
    } else if (sale.paymentMethod === 'credit') {
      deposit = 0;
    } else {
      deposit = Math.max(0, round2((sale.amountPaid || 0) - laterPayments));
    }

    // Never record more than the invoice total.
    deposit = Math.min(deposit, round2(sale.total));

    if (!DRY_RUN) {
      await Sale.updateOne({ _id: sale._id }, { $set: { amountPaidAtSale: deposit } });
    }
    updated += 1;
  }
  console.log(`${DRY_RUN ? '📝 Would update' : '✅ Updated'} ${updated} sale(s)`);

  // ── 2. Re-sync customer credit balances ────────────────────────────
  const customers = await Customer.find({});
  console.log(`🔎 Re-syncing credit for ${customers.length} customer(s)`);

  let creditFixed = 0;
  for (const customer of customers) {
    const customerSales = await Sale.find({ customer: customer._id });
    const outstanding = round2(
      customerSales.reduce((sum, sale) => sum + (sale.amountDue || 0), 0)
    );

    if (round2(customer.currentCredit) !== outstanding) {
      console.log(
        `   • ${customer.name}: ${round2(customer.currentCredit)} → ${outstanding}`
      );
      if (!DRY_RUN) {
        await Customer.updateOne(
          { _id: customer._id },
          { $set: { currentCredit: outstanding } }
        );
      }
      creditFixed += 1;
    }
  }
  console.log(
    `${DRY_RUN ? '📝 Would correct' : '✅ Corrected'} ${creditFixed} customer credit balance(s)`
  );

  await mongoose.disconnect();
  console.log('👋 Done');
};

run().catch(async (error) => {
  console.error('❌ Backfill failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
