import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Upload, Save, Image as ImageIcon, Palette } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Gorsellik = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme, updateTheme, fetchTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [visualSettings, setVisualSettings] = useState({
    logo_width: 150,
    logo_height: 50,
    preserve_aspect_ratio: true,
    primary_color: '#000000',
    accent_color: '#1CFF00',
  });

  useEffect(() => {
    // Load current theme settings
    if (theme) {
      setVisualSettings({
        logo_width: theme.logo_width || 150,
        logo_height: theme.logo_height || 50,
        preserve_aspect_ratio: theme.preserve_aspect_ratio !== false,
        primary_color: theme.primary_color || '#000000',
        accent_color: theme.accent_color || '#1CFF00',
      });
      if (theme.logo_url) {
        setLogoPreview(process.env.REACT_APP_BACKEND_URL + theme.logo_url);
      }
    }
  }, [theme]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dosya boyutu 2MB\'den küçük olmalı');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setLogoFile(file);

    // Auto-upload immediately
    await uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/visuals/logo`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      console.log('[Gorsellik] Logo uploaded:', response.data);
      toast.success('Logo yüklendi ve kaydedildi!');
      
      // Refresh theme to get new logo
      await fetchTheme();
      setLogoFile(null);
    } catch (error) {
      console.error('[Gorsellik] Error uploading logo:', error);
      toast.error(error.response?.data?.detail || 'Logo yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDimensions = async () => {
    try {
      setLoading(true);
      const result = await updateTheme({
        logo_width: visualSettings.logo_width,
        logo_height: visualSettings.logo_height,
        preserve_aspect_ratio: visualSettings.preserve_aspect_ratio,
      });

      if (result.success) {
        toast.success('Logo boyutları kaydedildi!');
      } else {
        toast.error(result.error || 'Kaydetme başarısız');
      }
    } catch (error) {
      console.error('[Gorsellik] Error saving dimensions:', error);
      toast.error('Boyutlar kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      setLoading(true);
      const result = await updateTheme({
        primary_color: visualSettings.primary_color,
        accent_color: visualSettings.accent_color,
      });

      if (result.success) {
        toast.success('Renkler kaydedildi ve uygulandı!');
      } else {
        toast.error(result.error || 'Kaydetme başarısız');
      }
    } catch (error) {
      console.error('[Gorsellik] Error saving colors:', error);
      toast.error('Renkler kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorType, value) => {
    setVisualSettings({ ...visualSettings, [colorType]: value });
  };

  // Only admins can access this page
  if (user?.role !== 'Yönetici') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-center text-gray-600">Bu sayfaya erişim yetkiniz yok.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('gorsellikTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('gorsellikSubtitle')}</p>
      </div>

      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logo Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {logoPreview && (
              <div className="flex-shrink-0">
                <div className="border-2 border-gray-200 rounded p-4 bg-gray-50">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{
                      width: `${visualSettings.logo_width}px`,
                      height: visualSettings.preserve_aspect_ratio ? 'auto' : `${visualSettings.logo_height}px`,
                      maxWidth: '300px',
                    }}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {visualSettings.logo_width}px x {visualSettings.preserve_aspect_ratio ? 'auto' : `${visualSettings.logo_height}px`}
                </p>
              </div>
            )}
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-accent transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Logo yüklemek için tıklayın</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (Max 2MB)</p>
                  <p className="text-xs text-accent mt-2">Logo otomatik olarak kaydedilir</p>
                </div>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={loading}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Logo Boyutları</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Genişlik (px)</Label>
                <Input
                  type="number"
                  min="50"
                  max="500"
                  value={visualSettings.logo_width}
                  onChange={(e) => setVisualSettings({ ...visualSettings, logo_width: parseInt(e.target.value) || 150 })}
                />
              </div>
              <div>
                <Label>Yükseklik (px)</Label>
                <Input
                  type="number"
                  min="30"
                  max="300"
                  value={visualSettings.logo_height}
                  onChange={(e) => setVisualSettings({ ...visualSettings, logo_height: parseInt(e.target.value) || 50 })}
                  disabled={visualSettings.preserve_aspect_ratio}
                  className={visualSettings.preserve_aspect_ratio ? 'bg-gray-100' : ''}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <Label>En-boy oranını koru</Label>
                <p className="text-xs text-gray-500">Yükseklik otomatik hesaplanır</p>
              </div>
              <Switch
                checked={visualSettings.preserve_aspect_ratio}
                onCheckedChange={(checked) => setVisualSettings({ ...visualSettings, preserve_aspect_ratio: checked })}
              />
            </div>

            <Button onClick={handleSaveDimensions} disabled={loading} className="w-full mt-4">
              <Save className="w-4 h-4 mr-2" />
              Boyutları Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Marka Renkleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Birincil Renk (Primary)</Label>
            <p className="text-xs text-gray-500 mb-2">Sidebar ve ana renk</p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={visualSettings.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                placeholder="#000000"
                className="font-mono"
              />
              <Input
                type="color"
                value={visualSettings.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                className="w-20 h-10"
              />
            </div>
          </div>

          <div>
            <Label>Vurgu Rengi (Accent)</Label>
            <p className="text-xs text-gray-500 mb-2">Butonlar ve aktif elementler</p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={visualSettings.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                placeholder="#1CFF00"
                className="font-mono"
              />
              <Input
                type="color"
                value={visualSettings.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                className="w-20 h-10"
              />
            </div>
          </div>

          {/* Color Preview */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Önizleme</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-2 font-medium">Birincil Renk</p>
                <div
                  className="h-20 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: visualSettings.primary_color }}
                ></div>
                <p className="text-xs text-gray-500 mt-1 text-center font-mono">{visualSettings.primary_color}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2 font-medium">Vurgu Rengi</p>
                <div
                  className="h-20 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: visualSettings.accent_color }}
                ></div>
                <p className="text-xs text-gray-500 mt-1 text-center font-mono">{visualSettings.accent_color}</p>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveColors} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Renkleri Kaydet ve Uygula
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <p>ℹ️ <strong>Logo Yükleme:</strong> Logo yüklendikten sonra otomatik olarak uygulanır ve üst menüde görünür.</p>
            <p>ℹ️ <strong>Renk Değişikliği:</strong> Renkleri kaydettikten sonra tüm uygulama otomatik güncellenir.</p>
            <p>ℹ️ <strong>Kalıcılık:</strong> Tüm ayarlar hesabınıza özel olarak kaydedilir ve sayfa yenilemeden sonra korunur.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Gorsellik;
