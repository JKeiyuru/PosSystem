/* eslint-disable no-unused-vars */
// client/src/pages/Settings.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings as SettingsIcon, User, Bell, Building } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
  const [loading, setLoading] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => {
    fetchSettings();
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
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
                      value={businessSettings.businessName}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={businessSettings.businessEmail}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessEmail: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      value={businessSettings.businessPhone}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessPhone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={businessSettings.currency}
                      onChange={(e) => setBusinessSettings({...businessSettings, currency: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Input
                      id="businessAddress"
                      value={businessSettings.businessAddress}
                      onChange={(e) => setBusinessSettings({...businessSettings, businessAddress: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={businessSettings.taxRate}
                      onChange={(e) => setBusinessSettings({...businessSettings, taxRate: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={businessSettings.lowStockThreshold}
                      onChange={(e) => setBusinessSettings({...businessSettings, lowStockThreshold: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="receiptFooter">Receipt Footer</Label>
                    <Input
                      id="receiptFooter"
                      value={businessSettings.receiptFooter}
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
                  <Input value={user?.role} disabled />
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
                  value={businessSettings.dailyReportTime}
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
                  {businessSettings.reportRecipients.map((email, index) => (
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
      </Tabs>
    </div>
  );
}