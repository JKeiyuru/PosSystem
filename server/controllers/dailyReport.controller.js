// server/controllers/dailyReport.controller.js
// Uses the shared calculation utility so the close-of-business figures match
// the dashboard exactly.

import DailyReport from '../models/DailyReport.model.js';
import Sale from '../models/Sale.model.js';
import PaymentTransaction from '../models/PaymentTransaction.model.js';
import { calculateSalesBreakdown, getDayRange } from '../utils/salesCalculations.js';

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

    const { start: startOfDay, end: endOfDay } = getDayRange(new Date(reportDate));

    const [sales, payments] = await Promise.all([
      Sale.find({ saleDate: { $gte: startOfDay, $lte: endOfDay } }),
      PaymentTransaction.find({ paymentDate: { $gte: startOfDay, $lte: endOfDay } }),
    ]);

    const breakdown = calculateSalesBreakdown(sales, payments);

    // TOTAL CASH = cash taken on sales + cash from debt repayments
    const totalCashReceived = breakdown.totalCash;
    const totalMpesa = breakdown.totalDigital;
    const creditSales = breakdown.creditIssued;
    const totalCreditPayments = breakdown.creditPaymentsCollected;

    // Total revenue = all money actually received today
    const totalRevenue = breakdown.totalCollected;

    // EXPECTED CASH = Opening Cash + Cash Received - Expenses
    const expenses = parseFloat(totalExpenses) || 0;
    const expectedCash = (parseFloat(openingCash) || 0) + totalCashReceived - expenses;
    const variance = (parseFloat(actualCash) || 0) - expectedCash;

    console.log('Daily report:', {
      cashReceived: totalCashReceived,
      digitalReceived: totalMpesa,
      creditIssued: creditSales,
      creditCollected: totalCreditPayments,
      totalRevenue,
      expectedCash,
      variance,
    });

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
      openingCash: parseFloat(openingCash) || 0,
      expectedCash,
      actualCash: parseFloat(actualCash) || 0,
      variance,
      totalExpenses: expenses,
      expensesNotes: expensesNotes || '',
      totalSales: sales.length,
      totalRevenue, // Actual money received (cash + digital + debt repayments)
      cashSales: totalCashReceived, // Total cash (sales + credit payments)
      mpesaSales: totalMpesa,
      creditSales, // Credit given today (NOT revenue)
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