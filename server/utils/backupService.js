// server/utils/backupService.js
// Local folder backups of the MongoDB database.
//
// Layout created inside the folder the admin chooses:
//
//   <backupPath>/
//     7thSep2026 BCUP/
//       manifest.json          <- summary: date, counts per collection
//       sales.json
//       products.json
//       customers.json
//       ...
//
// One JSON file per collection (easy to read, easy to restore).

import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Settings from '../models/Settings.model.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// e.g. "7thSep2026 BCUP"
export const backupFolderName = (date = new Date()) =>
  `${ordinal(date.getDate())}${MONTHS[date.getMonth()]}${date.getFullYear()} BCUP`;

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const uniqueFolder = async (root, base) => {
  let target = path.join(root, base);
  let i = 2;
  // If a backup already ran today, keep it and add a suffix
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fs.access(target);
      target = path.join(root, `${base} (${i++})`);
    } catch {
      return target;
    }
  }
};

const pruneOldBackups = async (root, retentionDays) => {
  if (!retentionDays || retentionDays <= 0) return 0;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.includes('BCUP')) continue;
    const full = path.join(root, entry.name);
    try {
      const stat = await fs.stat(full);
      if (stat.mtimeMs < cutoff) {
        await fs.rm(full, { recursive: true, force: true });
        removed += 1;
      }
    } catch {
      /* ignore */
    }
  }
  return removed;
};

/**
 * Verify a folder path can be written to.
 */
export const verifyBackupPath = async (folderPath) => {
  if (!folderPath) throw new Error('No backup folder has been set');
  await ensureDir(folderPath);
  const probe = path.join(folderPath, '.bekhal-write-test');
  await fs.writeFile(probe, 'ok');
  await fs.unlink(probe);
  return true;
};

/**
 * Run a full backup now.
 * @param {Object} options
 * @param {String} options.trigger 'manual' | 'scheduled' | 'catch-up'
 * @param {String} options.triggeredBy user name/id (optional)
 */
export const runBackup = async ({ trigger = 'manual', triggeredBy = 'system' } = {}) => {
  const settings = (await Settings.findOne()) || (await Settings.create({}));
  const root = (settings.backupPath || '').trim();

  if (!root) {
    const message = 'No backup folder has been set in Settings';
    settings.lastBackupStatus = 'failed';
    settings.lastBackupMessage = message;
    await settings.save();
    throw new Error(message);
  }

  const startedAt = new Date();

  try {
    await verifyBackupPath(root);

    const folder = await uniqueFolder(root, backupFolderName(startedAt));
    await ensureDir(folder);

    const collections = await mongoose.connection.db.listCollections().toArray();
    const summary = [];
    let totalDocs = 0;

    for (const { name } of collections) {
      if (name.startsWith('system.')) continue;
      const docs = await mongoose.connection.db.collection(name).find({}).toArray();
      await fs.writeFile(
        path.join(folder, `${name}.json`),
        JSON.stringify(docs, null, 2),
        'utf8'
      );
      summary.push({ collection: name, documents: docs.length });
      totalDocs += docs.length;
    }

    const manifest = {
      business: settings.businessName,
      backedUpAt: startedAt.toISOString(),
      trigger,
      triggeredBy,
      database: mongoose.connection.name,
      totalCollections: summary.length,
      totalDocuments: totalDocs,
      collections: summary,
      restoreHint:
        'Each .json file holds one collection. Restore with mongoimport --jsonArray, e.g. ' +
        'mongoimport --uri "<connection string>" --collection sales --file sales.json --jsonArray'
    };

    await fs.writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    const pruned = await pruneOldBackups(root, settings.backupRetentionDays);

    settings.lastBackupAt = new Date();
    settings.lastBackupStatus = 'success';
    settings.lastBackupFolder = folder;
    settings.lastBackupMessage = `Backed up ${totalDocs} records from ${summary.length} collections${
      pruned ? ` (removed ${pruned} old backup folder${pruned > 1 ? 's' : ''})` : ''
    }`;
    await settings.save();

    return { folder, manifest, prunedFolders: pruned };
  } catch (error) {
    settings.lastBackupStatus = 'failed';
    settings.lastBackupMessage = error.message;
    await settings.save();
    throw error;
  }
};

/**
 * List the backup folders already on disk.
 */
export const listBackups = async () => {
  const settings = (await Settings.findOne()) || (await Settings.create({}));
  const root = (settings.backupPath || '').trim();
  if (!root) return [];

  let entries = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.includes('BCUP')) continue;
    const full = path.join(root, entry.name);
    try {
      const stat = await fs.stat(full);
      const files = await fs.readdir(full);
      let sizeBytes = 0;
      for (const f of files) {
        const s = await fs.stat(path.join(full, f));
        sizeBytes += s.size;
      }
      results.push({
        name: entry.name,
        path: full,
        createdAt: stat.mtime,
        files: files.length,
        sizeBytes
      });
    } catch {
      /* ignore */
    }
  }

  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

let running = false;

/**
 * Checked every minute by the scheduler in index.js.
 * Runs the backup when the configured time has been reached today and it
 * hasn't run yet (this also covers the "computer was off" catch-up case).
 */
export const runScheduledBackupIfDue = async () => {
  if (running) return null;

  let settings;
  try {
    settings = await Settings.findOne();
  } catch {
    return null;
  }
  if (!settings || !settings.backupEnabled || !settings.backupPath) return null;

  const [hh, mm] = String(settings.backupTime || '22:00').split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const now = new Date();
  const dueToday = new Date(now);
  dueToday.setHours(hh, mm, 0, 0);

  if (now < dueToday) return null;

  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null;
  if (last && sameDay(last, now) && last >= dueToday) return null;

  // If catch-up is off, only run within 5 minutes of the scheduled time
  if (!settings.backupCatchUp && now - dueToday > 5 * 60 * 1000) return null;

  running = true;
  try {
    const trigger = now - dueToday > 5 * 60 * 1000 ? 'catch-up' : 'scheduled';
    const result = await runBackup({ trigger, triggeredBy: 'scheduler' });
    console.log(`💾 Automatic backup saved to ${result.folder}`);
    return result;
  } catch (error) {
    console.error('❌ Automatic backup failed:', error.message);
    return null;
  } finally {
    running = false;
  }
};
