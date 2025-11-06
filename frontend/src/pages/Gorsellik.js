import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Upload, Palette, Eye, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Gorsellik = () => {
  const { t } = useLanguage();
  const { theme, updateTheme, applyTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const validateHexColor = (hex) => {
    const hexRegex = /^#[0-9A-F]{6}$/i;
    return hexRegex.test(hex);
  };

  const handleLogoUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/visuals/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Logo yüklendi!');
      
      // Update local theme and apply immediately
      const newTheme = { ...localTheme, logo_url: response.data.logo_url };
      setLocalTheme(newTheme);
      applyTheme(newTheme);
      
      // Trigger page refresh to show new logo
      window.location.reload();
    } catch (error) {
      console.error('[Gorsellik] Logo upload error:', error);
      toast.error('Logo yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTheme = async () => {
    try {
      // Validate hex colors
      if (!validateHexColor(localTheme.primary_color)) {
        toast.error('Geçersiz ana renk hex kodu');
        return;
      }
      if (!validateHexColor(localTheme.accent_color)) {
        toast.error('Geçersiz vurgu rengi hex kodu');
        return;
      }

      setSaving(true);
      
      // Update theme via API
      const result = await updateTheme({
        logo_width: localTheme.logo_width,
        logo_height: localTheme.logo_height,
        preserve_aspect_ratio: localTheme.preserve_aspect_ratio,
        primary_color: localTheme.primary_color,
        accent_color: localTheme.accent_color,
      });

      if (result.success) {
        toast.success(t('saved'));
        // Apply theme immediately without reload
        applyTheme(localTheme);
        console.log('[Gorsellik] Theme applied live:', localTheme);
      } else {
        toast.error(result.error || 'Kaydedilemedi');
      }
    } catch (error) {
      console.error('[Gorsellik] Save error:', error);
      toast.error('Tema kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const logoStyle = {
    width: localTheme.preserve_aspect_ratio ? 'auto' : `${localTheme.logo_width}px`,
    height: `${localTheme.logo_height}px`,
    maxWidth: `${localTheme.logo_width}px`,
    objectFit: localTheme.preserve_aspect_ratio ? 'contain' : 'cover',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('gorsellikTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('gorsellikSubtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t('logoSettings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>{t('uploadLogo')}</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">PNG, JPG veya WEBP (Maks 5MB)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('width')} (px)</Label>
                <Input
                  type="number"
                  value={localTheme.logo_width}
                  onChange={(e) => setLocalTheme({ ...localTheme, logo_width: parseInt(e.target.value) || 150 })}
                />
              </div>
              <div>
                <Label>{t('height')} (px)</Label>
                <Input
                  type="number"
                  value={localTheme.logo_height}
                  onChange={(e) => setLocalTheme({ ...localTheme, logo_height: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-ratio" className="cursor-pointer">
                {t('preserveAspectRatio')}
              </Label>
              <Switch
                id="preserve-ratio"
                checked={localTheme.preserve_aspect_ratio}
                onCheckedChange={(checked) => setLocalTheme({ ...localTheme, preserve_aspect_ratio: checked })}
              />
            </div>

            <div className="border-t pt-6">
              <Label className="mb-3 block">
                <Eye className="w-4 h-4 inline mr-2" />
                {t('logoPreview')}
              </Label>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center min-h-[120px]">
                <img
                  src={process.env.REACT_APP_BACKEND_URL + theme.logo_url}
                  alt="Logo Preview"
                  style={logoStyle}
                  className="object-contain"
                  onError={(e) => {
                    console.error('[Gorsellik] Logo load error');
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {t('themeColors')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>{t('primaryColor')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={localTheme.primary_color}
                  onChange={(e) => setLocalTheme({ ...localTheme, primary_color: e.target.value })}
                  placeholder="#000000"
                />
                <div
                  className="w-16 h-10 rounded border-2 border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: localTheme.primary_color }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Ana renk ve metinler</p>
            </div>

            <div>
              <Label>{t('accentColor')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={localTheme.accent_color}
                  onChange={(e) => setLocalTheme({ ...localTheme, accent_color: e.target.value })}
                  placeholder="#1CFF00"
                />
                <div
                  className="w-16 h-10 rounded border-2 border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: localTheme.accent_color }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Vurgular ve butonlar</p>
            </div>

            <div className="border-t pt-6">
              <Label className="mb-3 block">Renk Önizleme</Label>
              <div className="space-y-2">
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: localTheme.primary_color, color: '#ffffff' }}
                >
                  <p className="font-semibold">Ana Renk</p>
                  <p className="text-sm">Kontrast kontrolü için örnek metin</p>
                </div>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: localTheme.accent_color, color: localTheme.primary_color }}
                >
                  <p className="font-semibold">Vurgu Rengi</p>
                  <p className="text-sm">Kontrast kontrolü için örnek metin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleSaveTheme}
            disabled={saving}
            className="w-full bg-accent hover:bg-accent/90 text-black font-semibold py-6"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : t('saveAndApply')}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Değişiklikler anlık olarak uygulanacaktır
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Gorsellik;
