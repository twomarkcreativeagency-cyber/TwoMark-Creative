import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, DollarSign, TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { tr } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const KazancTablosu = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [newRecord, setNewRecord] = useState({
    type: 'gelir',
    amount: '',
    company_id: '',
    company_text: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editRecord, setEditRecord] = useState({
    type: 'gelir',
    amount: '',
    company_id: '',
    company_text: '',
    description: '',
    date: '',
  });

  // Protect from non-admin access - Profit table is admin-only and private
  if (user && user.role !== 'Yönetici') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-center text-gray-600">Bu sayfaya erişim yetkiniz yok. Kazanç tablosu sadece yöneticilere özeldir.</p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchRecords();
    fetchCompanies();
  }, []);

  const fetchRecords = async () => {
    try {
      let url = `${API_URL}/profits`;
      if (dateFilter.start && dateFilter.end) {
        url += `?start_date=${dateFilter.start}&end_date=${dateFilter.end}`;
      }
      const response = await axios.get(url);
      setRecords(response.data);
      console.log('[KazancTablosu] Records loaded:', response.data.length);
    } catch (error) {
      console.error('[KazancTablosu] Error fetching records:', error);
      toast.error('Kayıtlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('[KazancTablosu] Error fetching companies:', error);
    }
  };

  const handleCreateRecord = async () => {
    try {
      if (!newRecord.amount || !newRecord.description || !newRecord.date) {
        toast.error(t('fillAllFields'));
        return;
      }

      await axios.post(`${API_URL}/profits`, {
        ...newRecord,
        amount: parseFloat(newRecord.amount),
        company_id: newRecord.company_id === 'none' ? '' : newRecord.company_id,
      });
      
      toast.success(t('recordCreated'));
      setDialogOpen(false);
      setNewRecord({
        type: 'gelir',
        amount: '',
        company_id: '',
        company_text: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      // Refresh both records and companies
      await Promise.all([fetchRecords(), fetchCompanies()]);
    } catch (error) {
      console.error('[KazancTablosu] Error creating record:', error);
      toast.error('Kayıt oluşturulamadı');
    }
  };

  const applyDateFilter = () => {
    fetchRecords();
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditRecord({
      type: record.type,
      amount: record.amount.toString(),
      company_id: record.company_id || '',
      company_text: record.company_text || '',
      description: record.description,
      date: record.date,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    try {
      if (!editRecord.amount || !editRecord.description || !editRecord.date) {
        toast.error(t('fillAllFields'));
        return;
      }

      await axios.put(`${API_URL}/profits/${editingRecord.id}`, {
        ...editRecord,
        amount: parseFloat(editRecord.amount),
        company_id: editRecord.company_id === 'none' ? '' : editRecord.company_id,
      });
      
      toast.success('Kayıt başarıyla güncellendi');
      setEditDialogOpen(false);
      setEditingRecord(null);
      await Promise.all([fetchRecords(), fetchCompanies()]);
    } catch (error) {
      console.error('[KazancTablosu] Error updating record:', error);
      toast.error('Kayıt güncellenemedi');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;

      await axios.delete(`${API_URL}/profits/${recordId}`);
      toast.success('Kayıt silindi');
      await fetchRecords();
    } catch (error) {
      console.error('[KazancTablosu] Error deleting record:', error);
      toast.error('Kayıt silinemedi');
    }
  };

  const groupByMonth = (records) => {
    const grouped = {};
    records.forEach((record) => {
      const month = format(new Date(record.date), 'MMMM yyyy', { locale: tr });
      if (!grouped[month]) {
        grouped[month] = { income: 0, expense: 0 };
      }
      if (record.type === 'gelir') {
        grouped[month].income += record.amount;
      } else {
        grouped[month].expense += record.amount;
      }
    });
    return grouped;
  };

  const groupByYear = (records) => {
    const grouped = {};
    records.forEach((record) => {
      const year = format(new Date(record.date), 'yyyy');
      if (!grouped[year]) {
        grouped[year] = { income: 0, expense: 0 };
      }
      if (record.type === 'gelir') {
        grouped[year].income += record.amount;
      } else {
        grouped[year].expense += record.amount;
      }
    });
    return grouped;
  };

  const totalIncome = records.filter((r) => r.type === 'gelir').reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records.filter((r) => r.type === 'gider').reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const monthlyData = groupByMonth(records);
  const yearlyData = groupByYear(records);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('kazancTablosuTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('kazancTablosuSubtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-black" data-testid="new-record-button">
              <Plus className="w-4 h-4 mr-2" />
              {t('yeniKayit')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('yeniKayit')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{t('type')}</Label>
                <Select value={newRecord.type || 'gelir'} onValueChange={(value) => setNewRecord({ ...newRecord, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gelir">{t('gelir')}</SelectItem>
                    <SelectItem value="gider">{t('gider')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('amount')} (₺)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>{t('companyOptional')}</Label>
                <Select
                  value={newRecord.company_id || 'none'}
                  onValueChange={(value) => setNewRecord({ ...newRecord, company_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none')}</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(!newRecord.company_id || newRecord.company_id === 'none') && (
                <div>
                  <Label>Firma Adı (Serbest Metin)</Label>
                  <Input
                    value={newRecord.company_text}
                    onChange={(e) => setNewRecord({ ...newRecord, company_text: e.target.value })}
                    placeholder="Firma adı girin"
                  />
                </div>
              )}

              <div>
                <Label>{t('description')}</Label>
                <Input
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  placeholder="Açıklama"
                />
              </div>

              <div>
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                />
              </div>

              <Button onClick={handleCreateRecord} className="w-full">
                {t('create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>{t('startDate')}</Label>
              <Input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label>{t('endDate')}</Label>
              <Input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              />
            </div>
            <Button onClick={applyDateFilter}>{t('filter')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('totalIncome')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
              <p className="text-2xl font-bold text-green-600">₺{totalIncome.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('totalExpense')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-500 mr-3" />
              <p className="text-2xl font-bold text-red-600">₺{totalExpense.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('netProfit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-accent mr-3" />
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-accent' : 'text-red-600'}`}>
                ₺{netProfit.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">{t('allRecords')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('monthlyView')}</TabsTrigger>
              <TabsTrigger value="yearly">{t('yearlyView')}</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('description')}</TableHead>
                    <TableHead>{t('company')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.type === 'gelir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {record.type === 'gelir' ? t('gelir') : t('gider')}
                        </span>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.company_name || record.company_text || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">₺{record.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="monthly">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('month')}</TableHead>
                    <TableHead className="text-right">{t('gelir')}</TableHead>
                    <TableHead className="text-right">{t('gider')}</TableHead>
                    <TableHead className="text-right">{t('net')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(monthlyData).reverse().map(([month, data]) => (
                    <TableRow key={month}>
                      <TableCell className="font-semibold">{month}</TableCell>
                      <TableCell className="text-right text-green-600">₺{data.income.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600">₺{data.expense.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        data.income - data.expense >= 0 ? 'text-accent' : 'text-red-600'
                      }`}>
                        ₺{(data.income - data.expense).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="yearly">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('year')}</TableHead>
                    <TableHead className="text-right">{t('gelir')}</TableHead>
                    <TableHead className="text-right">{t('gider')}</TableHead>
                    <TableHead className="text-right">{t('net')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(yearlyData).reverse().map(([year, data]) => (
                    <TableRow key={year}>
                      <TableCell className="font-semibold">{year}</TableCell>
                      <TableCell className="text-right text-green-600">₺{data.income.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600">₺{data.expense.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        data.income - data.expense >= 0 ? 'text-accent' : 'text-red-600'
                      }`}>
                        ₺{(data.income - data.expense).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default KazancTablosu;
