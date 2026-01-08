// server/controllers/dailyReport.controller.js - COMPLETELY FIXED

import DailyReport from '../models/DailyReport.model.js';
import Sale from '../models/Sale.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';

// server/controllers/dailyReport.controller.js - FIXED CASH CALCULATION
// [Previous code remains the same until createDailyReport function...]

export const createDailyReport = async (req, res) => {
  try {
    const { 
      reportDate, 
      openingCash, 
      actualCash, 
      totalExpenses,
      expensesNotes,
      notes 
    } = req.body;

    const date = new Date(reportDate);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Get all sales for the day
    const sales = await Sale.find({
      saleDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Get all payment transactions (credit payments) for the day
    const payments = await PaymentTransaction.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log(`Found ${sales.length} sales and ${payments.length} payment transactions for the day`);

    // ====== FIXED CALCULATION ======
    // Calculate CASH SALES (only sales paid with CASH method AND NOT CREDIT)
    const cashSales = sales
      .filter(s => s.paymentMethod === 'cash') // Only cash sales
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    // Calculate cash from CREDIT PAYMENTS made today (collected from old debts)
    const cashFromCreditPayments = payments
      .filter(p => p.paymentMethod === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    // TOTAL CASH RECEIVED = Cash sales + Cash from credit payments
    const totalCashReceived = cashSales + cashFromCreditPayments;

    console.log('Cash Sales:', cashSales);
    console.log('Cash from Credit Payments:', cashFromCreditPayments);
    console.log('Total Cash Received:', totalCashReceived);

    // Calculate M-Pesa sales (all M-Pesa payment methods combined, excluding credit)
    const mpesaSales = sales
      .filter(s => (s.paymentMethod.includes('mpesa') || s.paymentMethod.includes('gdc')) && s.paymentMethod !== 'credit')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    // M-Pesa from credit payments
    const mpesaFromCreditPayments = payments
      .filter(p => p.paymentMethod.includes('mpesa') || p.paymentMethod.includes('gdc'))
      .reduce((sum, p) => sum + p.amount, 0);

    const totalMpesa = mpesaSales + mpesaFromCreditPayments;

    // Credit sales (amount given on credit today) - NOT REVENUE!
    const creditSales = sales
      .filter(s => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    // ====== FIXED REVENUE CALCULATION ======
    // Total revenue = All PAID sales (excluding credit) + All credit payments collected today
    const totalPaidSales = sales
      .filter(s => s.paymentMethod !== 'credit') // Exclude credit sales
      .reduce((sum, s) => sum + s.amountPaid, 0);
    
    const totalCreditPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = totalPaidSales + totalCreditPayments;

    // ====== FIXED EXPECTED CASH CALCULATION ======
    // EXPECTED CASH = Opening Cash + Total Cash Received - Expenses
    const expectedCash = parseFloat(openingCash) + totalCashReceived - parseFloat(totalExpenses);
    
    // VARIANCE = Actual Cash - Expected Cash
    const variance = parseFloat(actualCash) - expectedCash;

    console.log('=== DAILY REPORT CALCULATION ===');
    console.log(`Opening Cash: ${openingCash}`);
    console.log(`Cash Sales (non-credit): ${cashSales}`);
    console.log(`Cash from Credit Payments: ${cashFromCreditPayments}`);
    console.log(`Total Cash Received: ${totalCashReceived}`);
    console.log(`Total Expenses: ${totalExpenses}`);
    console.log(`Expected Cash: ${expectedCash}`);
    console.log(`Actual Cash: ${actualCash}`);
    console.log(`Variance: ${variance}`);

    // Check if report already exists
    const existingReport = await DailyReport.findOne({
      reportDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Daily report already exists for this date'
      });
    }

    // Create the daily report
    const dailyReport = await DailyReport.create({
      reportDate: new Date(reportDate),
      openingCash: parseFloat(openingCash),
      expectedCash,
      actualCash: parseFloat(actualCash),
      variance,
      totalExpenses: parseFloat(totalExpenses),
      expensesNotes: expensesNotes || '',
      totalSales: sales.length,
      totalRevenue,
      cashSales: totalCashReceived, // Total cash (sales + credit payments)
      mpesaSales: totalMpesa,
      creditSales, // Amount given on credit today (for information only)
      creditPaymentsCollected: totalCreditPayments,
      salesCount: sales.length,
      closedBy: req.user.id,
      closedByName: req.user.name,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Daily report created successfully',
      data: dailyReport
    });
  } catch (error) {
    console.error('Error creating daily report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllDailyReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};

    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = new Date(startDate);
      if (endDate) query.reportDate.$lte = new Date(endDate);
    }

    const reports = await DailyReport.find(query)
      .populate('closedBy', 'name email')
      .sort({ reportDate: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDailyReportById = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id)
      .populate('closedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Daily report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const sendDailyReportEmail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { sendComprehensiveDailyReport } = await import('../utils/emailService.js');
    const result = await sendComprehensiveDailyReport(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Comprehensive daily report sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Error sending daily report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getDailyReportByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = new Date(date);
    
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const report = await DailyReport.findOne({
      reportDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('closedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No report found for this date'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};