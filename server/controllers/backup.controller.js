// server/controllers/backup.controller.js

import Settings from '../models/Settings.model.js';
import { runBackup, listBackups, verifyBackupPath } from '../utils/backupService.js';

const getOrCreateSettings = async () => (await Settings.findOne()) || (await Settings.create({}));

export const getBackupSettings = async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    res.json({
      success: true,
      data: {
        backupEnabled: s.backupEnabled,
        backupPath: s.backupPath,
        backupTime: s.backupTime,
        backupCatchUp: s.backupCatchUp,
        backupRetentionDays: s.backupRetentionDays,
        lastBackupAt: s.lastBackupAt,
        lastBackupStatus: s.lastBackupStatus,
        lastBackupMessage: s.lastBackupMessage,
        lastBackupFolder: s.lastBackupFolder
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBackupSettings = async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    const {
      backupEnabled,
      backupPath,
      backupTime,
      backupCatchUp,
      backupRetentionDays
    } = req.body;

    if (backupPath !== undefined) s.backupPath = String(backupPath).trim();
    if (backupEnabled !== undefined) s.backupEnabled = !!backupEnabled;
    if (backupCatchUp !== undefined) s.backupCatchUp = !!backupCatchUp;
    if (backupRetentionDays !== undefined) s.backupRetentionDays = Number(backupRetentionDays) || 0;
    if (backupTime !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(backupTime)) {
        return res.status(400).json({ success: false, message: 'Backup time must be in HH:MM format' });
      }
      s.backupTime = backupTime;
    }

    if (s.backupEnabled && !s.backupPath) {
      return res.status(400).json({ success: false, message: 'Choose a backup folder first' });
    }

    if (s.backupPath) {
      try {
        await verifyBackupPath(s.backupPath);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Cannot write to that folder: ${err.message}`
        });
      }
    }

    await s.save();
    res.json({ success: true, message: 'Backup settings saved', data: s });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runBackupNow = async (req, res) => {
  try {
    const result = await runBackup({
      trigger: 'manual',
      triggeredBy: req.user?.name || req.user?.email || 'admin'
    });
    res.json({
      success: true,
      message: `Backup saved to ${result.folder}`,
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBackupHistory = async (req, res) => {
  try {
    const backups = await listBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
