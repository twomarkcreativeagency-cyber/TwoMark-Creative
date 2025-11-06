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
  const { colors, setColors, logoSettings, setLogoSettings } = useTheme();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [visualSettings, setVisualSettings] = useState({
    logo_width: 120,
    logo_height: 120,
    maintain_aspect_ratio: true,
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#1CFF00',
  });

  useEffect(() => {
    fetchVisualSettings();
  }, []);

  const fetchVisualSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/visuals`);
      if (response.data) {
        setVisualSettings(response.data);
        if (response.data.logo_path) {
          setLogoPreview(process.env.REACT_APP_BACKEND_URL + response.data.logo_path);
        }
      }
    } catch (error) {
      console.error('[Gorsellik] Error fetching visual settings:', error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setLogoFile(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile) {
      toast.error('Lütfen bir logo seçin');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('width', visualSettings.logo_width);
      formData.append('height', visualSettings.logo_height);
      formData.append('maintain_aspect_ratio', visualSettings.maintain_aspect_ratio);

      await axios.post(`${API_URL}/visuals/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Logo yüklendi');
      setLogoFile(null);
      fetchVisualSettings();
    } catch (error) {
      console.error('[Gorsellik] Error uploading logo:', error);
      toast.error('Logo yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/visuals/colors`, {
        primary_color: visualSettings.primary_color,
        secondary_color: visualSettings.secondary_color,
        accent_color: visualSettings.accent_color,
      });

      // Update theme context for live preview
      setColors({
        primary: visualSettings.primary_color,
        accent: visualSettings.accent_color,
      });

      toast.success('Renkler kaydedildi');
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
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="flex-shrink-0">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{
                    width: `${visualSettings.logo_width}px`,
                    height: visualSettings.maintain_aspect_ratio ? 'auto' : `${visualSettings.logo_height}px`,
                  }}
                  className="border-2 border-gray-200 rounded"
                />
              </div>
            )}
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-accent transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Logo yüklemek için tıklayın</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (Max 2MB)</p>
                </div>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Genişlik (px)</Label>
              <Input
                type="number"
                value={visualSettings.logo_width}
                onChange={(e) => setVisualSettings({ ...visualSettings, logo_width: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Yükseklik (px)</Label>
              <Input
                type="number"
                value={visualSettings.logo_height}
                onChange={(e) => setVisualSettings({ ...visualSettings, logo_height: parseInt(e.target.value) })}
                disabled={visualSettings.maintain_aspect_ratio}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>En-boy oranını koru</Label>
            <Switch
              checked={visualSettings.maintain_aspect_ratio}
              onCheckedChange={(checked) => setVisualSettings({ ...visualSettings, maintain_aspect_ratio: checked })}
            />
          </div>

          <Button onClick={handleSaveLogo} disabled={loading || !logoFile} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Logo Kaydet
          </Button>
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
            <Label>Birincil Renk</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={visualSettings.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                placeholder="#000000"
              />
              <Input
                type="color"
                value={visualSettings.primary_color}
                onChange={(e) => handleColorChange('primary_color', e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          <div>
            <Label>İkincil Renk</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={visualSettings.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                placeholder="#ffffff"
              />
              <Input
                type="color"
                value={visualSettings.secondary_color}
                onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          <div>
            <Label>Vurgu Rengi (Accent)</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={visualSettings.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                placeholder="#1CFF00"
              />
              <Input
                type="color"
                value={visualSettings.accent_color}
                onChange={(e) => handleColorChange('accent_color', e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          {/* Color Preview */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div>
              <p className="text-xs text-gray-600 mb-2">Birincil</p>
              <div
                className="h-16 rounded border-2 border-gray-200"
                style={{ backgroundColor: visualSettings.primary_color }}
              ></div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">İkincil</p>
              <div
                className="h-16 rounded border-2 border-gray-200"
                style={{ backgroundColor: visualSettings.secondary_color }}
              ></div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Vurgu</p>
              <div
                className="h-16 rounded border-2 border-gray-200"
                style={{ backgroundColor: visualSettings.accent_color }}
              ></div>
            </div>
          </div>

          <Button onClick={handleSaveColors} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Renkleri Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Gorsellik;
