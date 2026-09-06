// client/src/components/settings/BackupSettings.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { HardDrive, RefreshCw, Save, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { backupService } from '../../services/backup.service';

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function BackupSettings() {
  const [form, setForm] = useState({
    backupEnabled: false,
    backupPath: '',
    backupTime: '22:00',
    backupCatchUp: true,
    backupRetentionDays: 30
  });
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const [settingsRes, historyRes] = await Promise.all([
        backupService.getSettings(),
        backupService.getHistory().catch(() => ({ data: [] }))
      ]);
      const d = settingsRes.data || {};
      setForm({
        backupEnabled: !!d.backupEnabled,
        backupPath: d.backupPath || '',
        backupTime: d.backupTime || '22:00',
        backupCatchUp: d.backupCatchUp !== false,
        backupRetentionDays: d.backupRetentionDays ?? 30
      });
      setStatus(d);
      setHistory(historyRes.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not load backup settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await backupService.updateSettings(form);
      setMessage({ type: 'success', text: 'Backup settings saved' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not save backup settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await backupService.runNow();
      setMessage({ type: 'success', text: res.message || 'Backup completed' });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Backup failed' });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin" />
          Loading backup settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <HardDrive className="h-5 w-5 mr-2" />
            Automatic Data Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Every backup creates a dated folder (for example <strong>7thSep2026 BCUP</strong>) inside the
            folder you choose, with one file per record type plus a summary file.
          </p>

          {message && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="backupPath">Backup folder on this computer</Label>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <Input
                id="backupPath"
                value={form.backupPath}
                onChange={(e) => setForm({ ...form, backupPath: e.target.value })}
                placeholder="e.g. C:\\BekhalBackups  or  /home/bekhal/backups"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste the full path of the folder. It is created automatically if it does not exist.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backupTime">Daily backup time</Label>
              <Input
                id="backupTime"
                type="time"
                value={form.backupTime}
                onChange={(e) => setForm({ ...form, backupTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention">Keep backups for (days)</Label>
              <Input
                id="retention"
                type="number"
                min="0"
                value={form.backupRetentionDays}
                onChange={(e) => setForm({ ...form, backupRetentionDays: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Use 0 to keep every backup forever.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={form.backupEnabled}
                onChange={(e) => setForm({ ...form, backupEnabled: e.target.checked })}
              />
              <span>Run the backup automatically every day</span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={form.backupCatchUp}
                onChange={(e) => setForm({ ...form, backupCatchUp: e.target.checked })}
              />
              <span>If the computer was off at that time, back up as soon as it is switched on</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={handleRunNow} disabled={running}>
              <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Backing up...' : 'Back Up Now'}
            </Button>
          </div>

          {status && (
            <div className="rounded-lg border p-4 text-sm space-y-1 bg-muted/40">
              <div className="flex items-center gap-2">
                <span className="font-medium">Last backup:</span>
                <span>{formatDateTime(status.lastBackupAt)}</span>
                {status.lastBackupStatus === 'success' && (
                  <Badge className="bg-primary text-primary-foreground">Success</Badge>
                )}
                {status.lastBackupStatus === 'failed' && (
                  <Badge className="bg-destructive text-destructive-foreground">Failed</Badge>
                )}
                {status.lastBackupStatus === 'never' && <Badge variant="outline">Never run</Badge>}
              </div>
              {status.lastBackupMessage && (
                <p className="text-muted-foreground">{status.lastBackupMessage}</p>
              )}
              {status.lastBackupFolder && (
                <p className="text-muted-foreground break-all">{status.lastBackupFolder}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups on this computer</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No backup folders found yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folder</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Files</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((b) => (
                  <TableRow key={b.path}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{formatDateTime(b.createdAt)}</TableCell>
                    <TableCell className="text-right">{b.files}</TableCell>
                    <TableCell className="text-right">{formatSize(b.sizeBytes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
