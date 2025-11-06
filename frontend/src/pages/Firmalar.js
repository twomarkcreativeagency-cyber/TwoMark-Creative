import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Building2, Trash2, Edit2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Firmalar = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    username: '',
    password: '',
    brand_color_hex: '#1CFF00',
    contact_info: '',
  });
  const [editCompany, setEditCompany] = useState({
    name: '',
    password: '',
    brand_color_hex: '#1CFF00',
    contact_info: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
      console.log('[Firmalar] Companies loaded:', response.data.length);
    } catch (error) {
      console.error('[Firmalar] Error fetching companies:', error);
      toast.error('Firmalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      if (!newCompany.name || !newCompany.username || !newCompany.password) {
        toast.error(t('fillAllFields'));
        return;
      }

      const hexRegex = /^#[0-9A-F]{6}$/i;
      if (!hexRegex.test(newCompany.brand_color_hex)) {
        toast.error('Geçersiz hex renk kodu');
        return;
      }

      await axios.post(`${API_URL}/companies`, newCompany);
      toast.success(t('companyCreated'));
      setDialogOpen(false);
      setNewCompany({
        name: '',
        username: '',
        password: '',
        brand_color_hex: '#1CFF00',
        contact_info: '',
      });
      // Refresh companies list immediately
      await fetchCompanies();
    } catch (error) {
      console.error('[Firmalar] Error creating company:', error);
      toast.error(error.response?.data?.detail || 'Firma oluşturulamadı');
    }
  };

  const handleEditClick = (company) => {
    setEditingCompany(company);
    setEditCompany({
      name: company.name,
      password: '',
      brand_color_hex: company.brand_color_hex || '#1CFF00',
      contact_info: company.contact_info || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCompany = async () => {
    try {
      if (!editCompany.name) {
        toast.error('Firma adı gereklidir');
        return;
      }

      const updateData = {
        name: editCompany.name,
        brand_color_hex: editCompany.brand_color_hex,
        contact_info: editCompany.contact_info,
      };

      // Only include password if it's being changed
      if (editCompany.password && editCompany.password.trim() !== '') {
        if (editCompany.password.length < 6) {
          toast.error('Şifre en az 6 karakter olmalıdır');
          return;
        }
        updateData.password = editCompany.password;
      }

      await axios.put(`${API_URL}/companies/${editingCompany.id}`, updateData);
      toast.success('Firma başarıyla güncellendi');
      setEditDialogOpen(false);
      setEditingCompany(null);
      setEditCompany({ name: '', password: '', brand_color_hex: '#1CFF00', contact_info: '' });
      await fetchCompanies();
    } catch (error) {
      console.error('[Firmalar] Error updating company:', error);
      toast.error(error.response?.data?.detail || 'Firma güncellenemedi');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      if (!window.confirm(t('deleteConfirm'))) return;
      
      await axios.delete(`${API_URL}/companies/${companyId}`);
      toast.success(t('deleted'));
      fetchCompanies();
    } catch (error) {
      console.error('[Firmalar] Error deleting company:', error);
      toast.error('Firma silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('firmalarTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('firmalarSubtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-black" data-testid="new-company-button">
              <Plus className="w-4 h-4 mr-2" />
              {t('yeniFirma')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('yeniFirma')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{t('companyName')}</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Firma adı"
                />
              </div>

              <div>
                <Label>{t('username')}</Label>
                <Input
                  value={newCompany.username}
                  onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                  placeholder="Kullanıcı adı"
                />
              </div>

              <div>
                <Label>{t('password')}</Label>
                <Input
                  type="password"
                  value={newCompany.password}
                  onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                  placeholder="Şifre"
                />
              </div>

              <div>
                <Label>{t('brandColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCompany.brand_color_hex}
                    onChange={(e) => setNewCompany({ ...newCompany, brand_color_hex: e.target.value })}
                    placeholder="#1CFF00"
                  />
                  <div
                    className="w-12 h-10 rounded border-2 border-gray-200"
                    style={{ backgroundColor: newCompany.brand_color_hex }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Takvim etkinlikleri için kullanılacak</p>
              </div>

              <div>
                <Label>{t('contactInfo')}</Label>
                <Input
                  value={newCompany.contact_info}
                  onChange={(e) => setNewCompany({ ...newCompany, contact_info: e.target.value })}
                  placeholder="İletişim bilgisi"
                />
              </div>

              <Button onClick={handleCreateCompany} className="w-full">
                {t('create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Firma Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t('companyName')}</Label>
              <Input
                value={editCompany.name}
                onChange={(e) => setEditCompany({ ...editCompany, name: e.target.value })}
                placeholder="Firma adı"
              />
            </div>

            <div>
              <Label>{t('username')}</Label>
              <Input
                value={editingCompany?.username || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Kullanıcı adı değiştirilemez</p>
            </div>

            <div>
              <Label>Yeni Şifre (Opsiyonel)</Label>
              <Input
                type="password"
                value={editCompany.password}
                onChange={(e) => setEditCompany({ ...editCompany, password: e.target.value })}
                placeholder="Boş bırakılırsa değiştirilmez"
              />
              <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
            </div>

            <div>
              <Label>{t('brandColor')}</Label>
              <div className="flex gap-2">
                <Input
                  value={editCompany.brand_color_hex}
                  onChange={(e) => setEditCompany({ ...editCompany, brand_color_hex: e.target.value })}
                  placeholder="#1CFF00"
                />
                <Input
                  type="color"
                  value={editCompany.brand_color_hex}
                  onChange={(e) => setEditCompany({ ...editCompany, brand_color_hex: e.target.value })}
                  className="w-20 h-10"
                />
              </div>
            </div>

            <div>
              <Label>{t('contactInfo')}</Label>
              <Input
                value={editCompany.contact_info}
                onChange={(e) => setEditCompany({ ...editCompany, contact_info: e.target.value })}
                placeholder="İletişim bilgisi"
              />
            </div>

            <Button onClick={handleUpdateCompany} className="w-full">
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('noCompanies')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('companies')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('companyName')}</TableHead>
                  <TableHead>{t('username')}</TableHead>
                  <TableHead>{t('hexColor')}</TableHead>
                  <TableHead>{t('contactInfo')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-200"
                          style={{ backgroundColor: company.brand_color_hex }}
                        ></div>
                        <span className="text-xs text-gray-600">{company.brand_color_hex}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{company.contact_info || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCompany(company.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Firmalar;
