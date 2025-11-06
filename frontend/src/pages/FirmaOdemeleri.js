import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const FirmaOdemeleri = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [newPayment, setNewPayment] = useState({
    company_id: '',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Protect from non-admin access
  if (user && user.role !== 'Yönetici') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-center text-gray-600">Bu sayfaya erişim yetkiniz yok. Sadece yöneticiler ödemeleri görüntüleyebilir.</p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchPayments();
    if (user?.role === 'Yönetici') {
      fetchCompanies();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      let url = `${API_URL}/payments`;
      if (dateFilter.start && dateFilter.end) {
        url += `?start_date=${dateFilter.start}&end_date=${dateFilter.end}`;
      }
      const response = await axios.get(url);
      setPayments(response.data);
      console.log('[FirmaOdemeleri] Payments loaded:', response.data.length);
    } catch (error) {
      console.error('[FirmaOdemeleri] Error fetching payments:', error);
      toast.error('Ödemeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('[FirmaOdemeleri] Error fetching companies:', error);
    }
  };

  const handleCreatePayment = async () => {
    try {
      // Check if company_id is not the placeholder value
      if (!newPayment.company_id || newPayment.company_id === 'unselected' || !newPayment.title || !newPayment.amount || !newPayment.date) {
        toast.error(t('fillAllFields'));
        return;
      }

      await axios.post(`${API_URL}/payments`, {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
      });
      
      toast.success(t('paymentCreated'));
      setDialogOpen(false);
      setNewPayment({
        company_id: '',
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      // Refresh both payments and companies (in case new company was added)
      await Promise.all([fetchPayments(), fetchCompanies()]);
    } catch (error) {
      console.error('[FirmaOdemeleri] Error creating payment:', error);
      toast.error('Ödeme oluşturulamadı');
    }
  };

  const handleToggleStatus = async (paymentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'odendi' ? 'odenecek' : 'odendi';
      await axios.put(`${API_URL}/payments/${paymentId}`, { status: newStatus });
      toast.success(t('updated'));
      fetchPayments();
    } catch (error) {
      console.error('[FirmaOdemeleri] Error updating payment:', error);
      toast.error('Ödeme güncellenemedi');
    }
  };

  const applyDateFilter = () => {
    fetchPayments();
  };

  const toPay = payments.filter((p) => p.status === 'odenecek');
  const paid = payments.filter((p) => p.status === 'odendi');
  const totalToPay = toPay.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('firmaOdemeleriTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('firmaOdemeleriSubtitle')}</p>
        </div>
        {user?.role === 'Yönetici' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-black" data-testid="new-payment-button">
                <Plus className="w-4 h-4 mr-2" />
                {t('yeniOdeme')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('yeniOdeme')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('company')}</Label>
                  <Select
                    value={newPayment.company_id || 'unselected'}
                    onValueChange={(value) => setNewPayment({ ...newPayment, company_id: value === 'unselected' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unselected">{t('select')}</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('paymentTitle')}</Label>
                  <Input
                    value={newPayment.title}
                    onChange={(e) => setNewPayment({ ...newPayment, title: e.target.value })}
                    placeholder="Ödeme başlığı"
                  />
                </div>

                <div>
                  <Label>{t('amount')} (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>{t('date')}</Label>
                  <Input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t('notes')}</Label>
                  <Textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    rows={3}
                    placeholder="Ek notlar"
                  />
                </div>

                <Button onClick={handleCreatePayment} className="w-full">
                  {t('create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
            <CardTitle className="text-sm font-medium text-gray-600">{t('totalToPay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-600">₺{totalToPay.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{toPay.length} ödeme</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('totalPaid')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">₺{totalPaid.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{paid.length} ödeme</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-accent">₺{(totalToPay + totalPaid).toFixed(2)}</p>
                <p className="text-sm text-gray-500">{payments.length} ödeme</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="odenecek">
            <TabsList className="mb-4">
              <TabsTrigger value="odenecek">{t('odenecek')} ({toPay.length})</TabsTrigger>
              <TabsTrigger value="odendi">{t('odendi')} ({paid.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="odenecek">
              {toPay.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('noPendingPayments')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('company')}</TableHead>
                      <TableHead>{t('title')}</TableHead>
                      <TableHead className="text-right">{t('amount')}</TableHead>
                      {user?.role === 'Yönetici' && <TableHead className="text-right">{t('actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toPay.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), 'dd.MM.yyyy')}</TableCell>
                        <TableCell className="font-medium">{payment.company_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.title}</p>
                            {payment.notes && <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">₺{payment.amount.toFixed(2)}</TableCell>
                        {user?.role === 'Yönetici' && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleToggleStatus(payment.id, payment.status)}
                            >
                              {t('markAsPaid')}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="odendi">
              {paid.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('noPaidPayments')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('company')}</TableHead>
                      <TableHead>{t('title')}</TableHead>
                      <TableHead className="text-right">{t('amount')}</TableHead>
                      {user?.role === 'Yönetici' && <TableHead className="text-right">{t('actions')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paid.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), 'dd.MM.yyyy')}</TableCell>
                        <TableCell className="font-medium">{payment.company_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.title}</p>
                            {payment.notes && <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₺{payment.amount.toFixed(2)}
                        </TableCell>
                        {user?.role === 'Yönetici' && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(payment.id, payment.status)}
                            >
                              {t('markAsUnpaid')}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirmaOdemeleri;
