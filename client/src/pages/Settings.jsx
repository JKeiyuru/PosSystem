/* eslint-disable no-unused-vars */
// client/src/pages/Settings.jsx - UPDATED with SyncCustomerCredits

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Settings as SettingsIcon, User, Bell, Building, Users, Database, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { RefreshCw, AlertCircle } from 'lucide-react';
import BackupSettings from '../components/settings/BackupSettings';

const SyncCustomerCredits = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    if (!window.confirm('This will sync all customer credits with actual debts. Continue?')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await api.post('/customers/sync-credits');
      setSyncResult(response.data.data);
      alert(`Sync completed! Updated ${response.data.data.updated} customers.`);
    } catch (error) {
      console.error('Error syncing credits:', error);
      alert('Error syncing credits: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
          Customer Credits Synchronization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Sync Customer Credits</h4>
          <p className="text-sm text-yellow-700 mb-3">
            This will recalculate all customer credits based on actual unpaid sales. 
            Use this if you notice discrepancies between customer page and debts page.
          </p>
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            variant="outline"
            className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Customer Credits'}
          </Button>
        </div>

        {syncResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Sync Results</h4>
            <div className="text-sm space-y-1">
              <p className="text-green-700">✅ Total Customers: {syncResult.totalCustomers}</p>
              <p className="text-green-700">✅ Updated: {syncResult.updated}</p>
              <p className="text-green-700">✅ Already in Sync: {syncResult.alreadyInSync}</p>
              {syncResult.errors > 0 && (
                <p className="text-red-600">❌ Errors: {syncResult.errors}</p>
              )}
            </div>

            {syncResult.updates && syncResult.updates.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto">
                <p className="font-semibold text-sm mb-1">Updated Customers:</p>
                {syncResult.updates.map((update, index) => (
                  <div key={index} className="text-xs text-gray-600 border-l-2 border-green-400 pl-2 mb-1">
                    {update.name}: KES {update.oldCredit.toFixed(2)} → KES {update.newCredit.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Settings() {
  const { user } = useAuth();
  const [businessSettings, setBusinessSettings] = useState({
    businessName: 'Bekhal Animal Feeds',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    taxRate: 0,
    currency: 'KES',
    receiptFooter: '',
    lowStockThreshold: 10,
    enableEmailAlerts: true,
    dailyReportTime: '18:00',
    reportRecipients: []
  });
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [users, setUsers] = useState([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'cashier'
  });
  const [loading, setLoading] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => {
    fetchSettings();
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success) {
        setBusinessSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleBusinessSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/settings', businessSettings);
      alert('Business settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/auth/profile', profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!userForm.name || !userForm.username || !userForm.email || !userForm.password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', userForm);
      alert('User created successfully!');
      setShowUserDialog(false);
      setUserForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'cashier'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error creating user: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = () => {
    if (newRecipient && !businessSettings.reportRecipients.includes(newRecipient)) {
      setBusinessSettings({
        ...businessSettings,
        reportRecipients: [...businessSettings.reportRecipients, newRecipient]
      });
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email) => {
    setBusinessSettings({
      ...businessSettings,
      reportRecipients: businessSettings.reportRecipients.filter(r => r !== email)
    });
  };

  // Calculate the number of columns based on user role
  const tabCols = user?.role === 'admin' ? 5 : 4;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className={`grid w-full grid-cols-${tabCols}`}>
          <TabsTrigger value="business">
            <Building className="mr-2 h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data-management">
            <Database className="mr-2 h-4 w-4" />
            Data Management
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          )}
        </TabsList>

        {/* Business Settings Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBusinessSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessSettings.businessName || ''}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessSettings.businessEmail || ''}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessEmail: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      value={businessSettings.businessPhone || ''}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessPhone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={businessSettings.currency || 'KES'}
                      onChange={(e) => setBusinessSettings({...businessSettings, currency: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Input
                      id="businessAddress"
                      value={businessSettings.businessAddress || ''}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessAddress: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={businessSettings.taxRate || 0}
                      onChange={(e) => setBusinessSettings({...businessSettings, taxRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={businessSettings.lowStockThreshold || 10}
                      onChange={(e) => setBusinessSettings({...businessSettings, lowStockThreshold: parseInt(e.target.value) || 10})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="receiptFooter">Receipt Footer</Label>
                    <Input
                      id="receiptFooter"
                      value={businessSettings.receiptFooter || ''}
                      onChange={(e) => setBusinessSettings({...businessSettings, receiptFooter: e.target.value})}
                      placeholder="Thank you for your business!"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Business Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role || ''} disabled />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Email Alerts</p>
                    <p className="text-sm text-gray-600">Receive email notifications for low stock and daily reports</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={businessSettings.enableEmailAlerts}
                    onChange={(e) => setBusinessSettings({...businessSettings, enableEmailAlerts: e.target.checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyReportTime">Daily Report Time</Label>
                  <Input
                    id="dailyReportTime"
                    type="time"
                    value={businessSettings.dailyReportTime || '18:00'}
                    onChange={(e) => setBusinessSettings({...businessSettings, dailyReportTime: e.target.value})}
                  />
                  <p className="text-sm text-gray-600">Time when daily reports will be sent</p>
                </div>

                <div className="space-y-2">
                  <Label>Report Recipients</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddRecipient}>Add</Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {businessSettings.reportRecipients?.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{email}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveRecipient(email)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleBusinessSettingsSubmit} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data-management" className="space-y-4">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700 mb-2">
                    ⚠️ <strong>Data management operations should be performed with caution.</strong>
                  </p>
                  <p className="text-sm text-orange-700">
                    These tools can modify your business data. Make sure to have a backup before proceeding.
                    Only administrators should use these features.
                  </p>
                </div>
              </CardContent>
            </Card>

            <SyncCustomerCredits />

            {user?.role === 'admin' && <BackupSettings />}
          </TabsContent>

          {/* Users Tab - Admin Only */}
          {user?.role === 'admin' && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Management</CardTitle>
                    <Button onClick={() => setShowUserDialog(true)}>
                      <Users className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u._id}>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.isActive ? 'success' : 'destructive'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userUsername">Username *</Label>
                <Input
                  id="userUsername"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  placeholder="johndoe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPassword">Password *</Label>
                <Input
                  id="userPassword"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole">Role *</Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                  <SelectTrigger id="userRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowUserDialog(false);
                    setUserForm({
                      name: '',
                      username: '',
                      email: '',
                      password: '',
                      role: 'cashier'
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }