import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Save, User, Lock, Mail } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Ayarlar = () => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/users/${user.id}`, {
        full_name: profileData.full_name,
      });
      
      // Update user in context
      setUser({ ...user, full_name: profileData.full_name });
      toast.success('Profil güncellendi');
    } catch (error) {
      console.error('[Ayarlar] Error updating profile:', error);
      toast.error('Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        toast.error('Tüm alanları doldurun');
        return;
      }

      if (passwordData.new_password !== passwordData.confirm_password) {
        toast.error('Şifreler eşleşmiyor');
        return;
      }

      if (passwordData.new_password.length < 6) {
        toast.error('Şifre en az 6 karakter olmalı');
        return;
      }

      setLoading(true);
      await axios.put(`${API_URL}/users/${user.id}/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      toast.success('Şifre değiştirildi');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('[Ayarlar] Error changing password:', error);
      toast.error(error.response?.data?.detail || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('ayarlar')}</h1>
        <p className="text-gray-600 mt-1">Hesap ayarlarınızı yönetin</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('fullName')}</Label>
            <Input
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              placeholder="Ad Soyad"
            />
          </div>

          <div>
            <Label>{t('username')}</Label>
            <Input
              value={profileData.username}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Kullanıcı adı değiştirilemez</p>
          </div>

          <div>
            <Label>{t('role')}</Label>
            <Input
              value={user?.role || ''}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {t('save')}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Şifre Değiştir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mevcut Şifre</Label>
            <Input
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              placeholder="Mevcut şifreniz"
            />
          </div>

          <div>
            <Label>Yeni Şifre</Label>
            <Input
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              placeholder="Yeni şifre (en az 6 karakter)"
            />
          </div>

          <div>
            <Label>Yeni Şifre (Tekrar)</Label>
            <Input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              placeholder="Yeni şifrenizi tekrar girin"
            />
          </div>

          <Button onClick={handleChangePassword} disabled={loading} className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            Şifre Değiştir
          </Button>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Bilgisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Uygulama:</span>
              <span className="font-semibold">TwoMark Creative CRM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Versiyon:</span>
              <span className="font-semibold">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dil:</span>
              <span className="font-semibold">Türkçe</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ayarlar;
