// server/controllers/dailyReport.controller.js

import DailyReport from '../models/DailyReport.model.js';
import Sale from '../models/Sale.model.js';

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

    // Get sales for the day
    const date = new Date(reportDate);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      saleDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Calculate sales summary
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const cashSales = sales.filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    const mpesaSales = sales.filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.amountPaid, 0);
    const creditSales = sales.filter(s => s.paymentMethod === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    // Calculate expected cash
    // Expected = Opening Cash + Cash Sales + M-Pesa Sales - Expenses
    const expectedCash = parseFloat(openingCash) + cashSales + mpesaSales - parseFloat(totalExpenses);
    
    // Calculate variance
    const variance = parseFloat(actualCash) - expectedCash;

    // Check if report already exists for this date
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

    // Create daily report
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
      cashSales,
      mpesaSales,
      creditSales,
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
    
    const { sendDailyReportWithBalance } = await import('../utils/emailService.js');
    const result = await sendDailyReportWithBalance(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'Failed to send email'
      });
    }
  } catch (error) {
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