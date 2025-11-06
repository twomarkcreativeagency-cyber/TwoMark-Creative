import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    company_id: '',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    if (user?.role === 'Admin') {
      fetchCompanies();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments`);
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.company_id || !newPayment.title || !newPayment.amount || !newPayment.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = { ...newPayment, amount: parseFloat(newPayment.amount) };
      await axios.post(`${API_URL}/payments`, payload);
      toast.success('Payment created successfully!');
      setDialogOpen(false);
      setNewPayment({
        company_id: '',
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchPayments();
    } catch (error) {
      toast.error('Failed to create payment');
    }
  };

  const handleToggleStatus = async (paymentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'to_pay' : 'paid';
      await axios.put(`${API_URL}/payments/${paymentId}`, { status: newStatus });
      toast.success(`Payment marked as ${newStatus === 'paid' ? 'Paid' : 'To Pay'}`);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const toPay = payments.filter((p) => p.status === 'to_pay');
  const paid = payments.filter((p) => p.status === 'paid');

  const totalToPay = toPay.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6" data-testid="payments">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Payments
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {user?.role === 'Admin' ? 'Manage company payments' : 'Your payment information'}
          </p>
        </div>

        {user?.role === 'Admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="create-payment-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Company</Label>
                  <Select
                    value={newPayment.company_id}
                    onValueChange={(value) => setNewPayment({ ...newPayment, company_id: value })}
                  >
                    <SelectTrigger data-testid="payment-company-select">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    data-testid="payment-title-input"
                    value={newPayment.title}
                    onChange={(e) => setNewPayment({ ...newPayment, title: e.target.value })}
                    placeholder="Payment title"
                  />
                </div>

                <div>
                  <Label>Amount</Label>
                  <Input
                    data-testid="payment-amount-input"
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    data-testid="payment-date-input"
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreatePayment} className="w-full" data-testid="payment-submit-button">
                  Create Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total To Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-600">${totalToPay.toFixed(2)}</p>
                <p className="text-sm text-slate-500">{toPay.length} payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                <p className="text-sm text-slate-500">{paid.length} payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold text-primary">${(totalToPay + totalPaid).toFixed(2)}</p>
                <p className="text-sm text-slate-500">{payments.length} payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="to_pay">
            <TabsList className="mb-4">
              <TabsTrigger value="to_pay" data-testid="to-pay-tab">
                To Pay ({toPay.length})
              </TabsTrigger>
              <TabsTrigger value="paid" data-testid="paid-tab">
                Paid ({paid.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="to_pay">
              {toPay.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No pending payments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {user?.role === 'Admin' && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toPay.map((payment) => (
                      <TableRow key={payment.id} data-testid={`payment-${payment.id}`}>
                        <TableCell>{format(new Date(payment.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{payment.company_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.title}</p>
                            {payment.notes && <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        {user?.role === 'Admin' && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleToggleStatus(payment.id, payment.status)}
                              data-testid={`mark-paid-${payment.id}`}
                            >
                              Mark as Paid
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="paid">
              {paid.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No paid payments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {user?.role === 'Admin' && <TableHead className="text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paid.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{payment.company_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.title}</p>
                            {payment.notes && <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${payment.amount.toFixed(2)}
                        </TableCell>
                        {user?.role === 'Admin' && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(payment.id, payment.status)}
                            >
                              Mark as Unpaid
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

export default Payments;
