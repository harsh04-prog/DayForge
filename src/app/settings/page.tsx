'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { AvatarSelector } from '@/components/common/AvatarSelector';
import { api } from '@/services/api';
import { usePWA } from '@/context/PWAContext';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  User,
  Bell,
  Sliders,
  Shield,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, updateProfile, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { openInstallGuide, isInstalled } = usePWA();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(profile?.avatar_url || 'male_1');

  // Notification Preferences
  const [quietStart, setQuietStart] = useState(user?.settings?.quiet_hours_start || '22:00');
  const [quietEnd, setQuietEnd] = useState(user?.settings?.quiet_hours_end || '07:00');
  const [maxReminders, setMaxReminders] = useState(user?.settings?.max_daily_reminders || 10);
  const [reminderTone, setReminderTone] = useState('encouraging');
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.sound_enabled ?? true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      if (user.settings) {
        setQuietStart(user.settings.quiet_hours_start || '22:00');
        setQuietEnd(user.settings.quiet_hours_end || '07:00');
        setMaxReminders(user.settings.max_daily_reminders || 10);
        setSoundEnabled(user.settings.sound_enabled ?? true);
      }
    }
    if (profile) {
      setBio(profile.bio || '');
      if (profile.avatar_url) setSelectedAvatarId(profile.avatar_url);
    }
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: selectedAvatarId,
      });
      showSuccess('Profile Updated', 'Your identity and settings have been saved.');
    } catch (err: any) {
      showError('Update Failed', err.response?.data?.detail || 'Could not save profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings', {
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        max_daily_reminders: maxReminders,
        sound_enabled: soundEnabled,
      });
      showSuccess('Reminders Updated', 'Your companion notification schedule is active.');
    } catch (err: any) {
      showError('Save Failed', err.response?.data?.detail || 'Failed to update reminder preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto text-slate-900">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Settings & Profile
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Manage your realistic 3D avatar, companion reminders, and preferences.
          </p>
        </div>

        {/* Navigation Tabs (Mobile-friendly horizontal scroll) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeTab === 'profile'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            Profile & 3D Avatar
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeTab === 'preferences'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Preferences
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeTab === 'security'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
        </div>

        {/* 1. PROFILE & 3D AVATAR TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Live Character Summary Card */}
            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                <Avatar
                  src={selectedAvatarId}
                  name={fullName || 'Hero'}
                  size="2xl"
                  glow
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#6C5CE7] bg-[#6C5CE7]/10 px-2.5 py-0.5 rounded-full">
                      Level {profile?.level || 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Disciplined
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{fullName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">@{user?.username} • {user?.email}</p>
                  <p className="text-xs text-slate-600 mt-2 font-medium">
                    {bio || 'Forging habits one day at a time.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* 3D Avatar Selection Grid */}
            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft">
              <AvatarSelector
                selectedAvatarId={selectedAvatarId}
                onSelect={(id) => setSelectedAvatarId(id)}
                title="Select Your 3D Character"
                subtitle="Choose from realistic 3D human character avatars"
              />
            </Card>

            {/* Profile Details Form */}
            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft space-y-4">
              <h4 className="text-base font-black text-slate-900">Profile Details</h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personal Bio / Motivation
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="e.g. Building daily discipline and levelling up."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="font-black rounded-2xl px-6 min-h-[44px]"
                >
                  Save Identity
                </Button>
              </div>
            </Card>
          </form>
        )}

        {/* 2. PREFERENCES & PWA APP TAB */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft space-y-4">
              <h4 className="text-base font-black text-slate-900">Application Preferences</h4>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">Sound Effects</p>
                  <p className="text-[11px] text-slate-500">Play pleasant audio chime on habit completion.</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-[#6C5CE7] focus:ring-[#6C5CE7]"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">Visual Theme</p>
                  <p className="text-[11px] text-slate-500">Minimal SaaS Light Theme (Default)</p>
                </div>
                <span className="text-xs font-black text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                  Light Theme
                </span>
              </div>
            </Card>

            {/* Install DayForge PWA In-App Card */}
            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F9FC] border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src="/icons/icon-192x192.png"
                      alt="DayForge App"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-tight">Install DayForge App</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Launch DayForge directly from your home screen or desktop without browser bars.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={openInstallGuide}
                  className="font-black rounded-2xl px-6 min-h-[44px] shrink-0 shadow-xs"
                >
                  {isInstalled ? 'App Installed ✓' : 'Install App'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 4. SECURITY & SESSION TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft space-y-4">
              <h4 className="text-base font-black text-slate-900">Account Security</h4>
              <p className="text-xs text-slate-500">Your master password and authentication sessions.</p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-bold text-slate-800">Password is secured with bcrypt hashing.</p>
                <p className="text-slate-500">To update your password, please contact DayForge support or verify via email.</p>
              </div>
            </Card>

            <Card className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-black text-slate-900">Active Session</h4>
                  <p className="text-xs text-slate-500">Sign out of your DayForge account on this device.</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => logout()}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold rounded-2xl min-h-[44px] px-6"
                >
                  Log Out
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
