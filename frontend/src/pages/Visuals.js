import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { useVisuals } from '../contexts/VisualsContext';
import { Upload, Palette, Eye } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Visuals = () => {
  const { visuals, updateVisuals, fetchVisuals } = useVisuals();
  const [localVisuals, setLocalVisuals] = useState(visuals);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLocalVisuals(visuals);
  }, [visuals]);

  const validateHexColor = (hex) => {
    const hexRegex = /^#[0-9A-F]{6}$/i;
    return hexRegex.test(hex);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/visuals/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Logo uploaded successfully!');
      fetchVisuals();
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveVisuals = async () => {
    // Validate hex colors
    if (!validateHexColor(localVisuals.primary_color)) {
      toast.error('Invalid primary color hex code');
      return;
    }
    if (!validateHexColor(localVisuals.secondary_color)) {
      toast.error('Invalid secondary color hex code');
      return;
    }
    if (!validateHexColor(localVisuals.accent_color)) {
      toast.error('Invalid accent color hex code');
      return;
    }

    const result = await updateVisuals(localVisuals);
    if (result.success) {
      toast.success('Visuals updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update visuals');
    }
  };

  const logoStyle = {
    width: localVisuals.preserve_aspect_ratio ? 'auto' : `${localVisuals.logo_width}px`,
    height: localVisuals.preserve_aspect_ratio ? `${localVisuals.logo_height}px` : `${localVisuals.logo_height}px`,
    maxWidth: `${localVisuals.logo_width}px`,
    objectFit: localVisuals.preserve_aspect_ratio ? 'contain' : 'fill',
  };

  return (
    <div className="space-y-6" data-testid="visuals">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Visuals
        </h1>
        <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Customize your brand appearance and theme
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Logo Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Upload Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="mt-1"
                data-testid="logo-upload-input"
              />
              <p className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={localVisuals.logo_width}
                  onChange={(e) =>
                    setLocalVisuals({ ...localVisuals, logo_width: parseInt(e.target.value) || 150 })
                  }
                  data-testid="logo-width-input"
                />
              </div>
              <div>
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={localVisuals.logo_height}
                  onChange={(e) =>
                    setLocalVisuals({ ...localVisuals, logo_height: parseInt(e.target.value) || 50 })
                  }
                  data-testid="logo-height-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-ratio" className="cursor-pointer">
                Preserve Aspect Ratio
              </Label>
              <Switch
                id="preserve-ratio"
                checked={localVisuals.preserve_aspect_ratio}
                onCheckedChange={(checked) =>
                  setLocalVisuals({ ...localVisuals, preserve_aspect_ratio: checked })
                }
                data-testid="preserve-ratio-switch"
              />
            </div>

            <div className="border-t pt-6">
              <Label className="mb-3 block">
                <Eye className="w-4 h-4 inline mr-2" />
                Logo Preview
              </Label>
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-8 flex items-center justify-center min-h-[120px]">
                <img
                  src={process.env.REACT_APP_BACKEND_URL + visuals.logo_url}
                  alt="Logo Preview"
                  style={logoStyle}
                  className="object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Theme Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={localVisuals.primary_color}
                  onChange={(e) => setLocalVisuals({ ...localVisuals, primary_color: e.target.value })}
                  placeholder="#1CFF00"
                  data-testid="primary-color-input"
                />
                <div
                  className="w-16 h-10 rounded border-2 border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: localVisuals.primary_color }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Main brand color and accents</p>
            </div>

            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={localVisuals.secondary_color}
                  onChange={(e) => setLocalVisuals({ ...localVisuals, secondary_color: e.target.value })}
                  placeholder="#0A0A0A"
                  data-testid="secondary-color-input"
                />
                <div
                  className="w-16 h-10 rounded border-2 border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: localVisuals.secondary_color }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Supporting backgrounds and text</p>
            </div>

            <div>
              <Label>Accent Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={localVisuals.accent_color}
                  onChange={(e) => setLocalVisuals({ ...localVisuals, accent_color: e.target.value })}
                  placeholder="#1CFF00"
                  data-testid="accent-color-input"
                />
                <div
                  className="w-16 h-10 rounded border-2 border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: localVisuals.accent_color }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Highlights and interactive elements</p>
            </div>

            <div className="border-t pt-6">
              <Label className="mb-3 block">Color Contrast Check</Label>
              <div className="space-y-2">
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: localVisuals.primary_color, color: localVisuals.secondary_color }}
                >
                  <p className="font-semibold">Primary on Secondary</p>
                  <p className="text-sm">Sample text for contrast check</p>
                </div>
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: localVisuals.accent_color, color: '#ffffff' }}
                >
                  <p className="font-semibold">Accent with White</p>
                  <p className="text-sm">Sample text for contrast check</p>
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
            onClick={handleSaveVisuals}
            className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-semibold py-6"
            data-testid="save-visuals-button"
          >
            Save & Apply Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Visuals;
