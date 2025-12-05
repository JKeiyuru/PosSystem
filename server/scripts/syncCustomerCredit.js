// server/scripts/syncCustomerCredit.js - Run this once to fix existing data

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../models/Customer.model.js';
import Sale from '../models/Sale.model.js';

dotenv.config();

const syncCustomerCredit = async () => {
  try {
    console.log('🔄 Starting customer credit synchronization...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active customers
    const customers = await Customer.find({ isActive: true });
    console.log(`📊 Found ${customers.length} active customers\n`);

    let syncCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
      try {
        // Calculate actual debt from sales
        const actualDebt = await Sale.aggregate([
          {
            $match: {
              customer: customer._id,
              amountDue: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              totalDebt: { $sum: '$amountDue' }
            }
          }
        ]);

        const calculatedDebt = actualDebt.length > 0 ? actualDebt[0].totalDebt : 0;
        const roundedDebt = Math.round(calculatedDebt * 100) / 100;
        
        // Check if there's a mismatch
        const currentCredit = Math.round(customer.currentCredit * 100) / 100;
        
        if (Math.abs(currentCredit - roundedDebt) > 0.01) {
          console.log(`📝 ${customer.name}:`);
          console.log(`   Current Credit: KES ${currentCredit.toFixed(2)}`);
          console.log(`   Actual Debt:    KES ${roundedDebt.toFixed(2)}`);
          console.log(`   Difference:     KES ${Math.abs(currentCredit - roundedDebt).toFixed(2)}`);
          
          // Update customer
          customer.currentCredit = roundedDebt;
          await customer.save();
          
          console.log(`   ✅ Updated!\n`);
          syncCount++;
        }
      } catch (error) {
        console.error(`❌ Error syncing ${customer.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 SYNCHRONIZATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Customers:      ${customers.length}`);
    console.log(`Updated:              ${syncCount}`);
    console.log(`Errors:               ${errorCount}`);
    console.log(`Already in Sync:      ${customers.length - syncCount - errorCount}`);
    console.log('='.repeat(50));

    if (syncCount > 0) {
      console.log('\n✅ Credit synchronization completed successfully!');
    } else {
      console.log('\n✅ All customer credits are already in sync!');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the sync
syncCustomerCredit();