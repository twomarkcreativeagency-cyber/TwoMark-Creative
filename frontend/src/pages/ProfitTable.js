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
import { toast } from 'sonner';
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parse } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ProfitTable = () => {
  const [records, setRecords] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [newRecord, setNewRecord] = useState({
    type: 'income',
    amount: '',
    company_id: '',
    company_text: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
    fetchCompanies();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/profits`);
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to fetch records');
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

  const handleCreateRecord = async () => {
    if (!newRecord.amount || !newRecord.description || !newRecord.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = { ...newRecord, amount: parseFloat(newRecord.amount) };
      await axios.post(`${API_URL}/profits`, payload);
      toast.success('Record created successfully!');
      setDialogOpen(false);
      setNewRecord({
        type: 'income',
        amount: '',
        company_id: '',
        company_text: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchRecords();
    } catch (error) {
      toast.error('Failed to create record');
    }
  };

  const groupByMonth = (records) => {
    const grouped = {};
    records.forEach((record) => {
      const month = format(new Date(record.date), 'MMM yyyy');
      if (!grouped[month]) {
        grouped[month] = { income: 0, expense: 0, records: [] };
      }
      if (record.type === 'income') {
        grouped[month].income += record.amount;
      } else {
        grouped[month].expense += record.amount;
      }
      grouped[month].records.push(record);
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
      if (record.type === 'income') {
        grouped[year].income += record.amount;
      } else {
        grouped[year].expense += record.amount;
      }
    });
    return grouped;
  };

  const totalIncome = records
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const monthlyData = groupByMonth(records);
  const yearlyData = groupByYear(records);

  return (
    <div className="space-y-6" data-testid="profit-table">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Profit Table
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Track your income and expenses
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="create-profit-record-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Profit/Expense Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Type</Label>
                <Select value={newRecord.type} onValueChange={(value) => setNewRecord({ ...newRecord, type: value })}>
                  <SelectTrigger data-testid="profit-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  data-testid="profit-amount-input"
                  type="number"
                  step="0.01"
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Company (Optional)</Label>
                <Select
                  value={newRecord.company_id || 'none'}
                  onValueChange={(value) => setNewRecord({ ...newRecord, company_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company or leave blank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                  <Label>Company Name (Free Text)</Label>
                  <Input
                    value={newRecord.company_text}
                    onChange={(e) => setNewRecord({ ...newRecord, company_text: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
              )}

              <div>
                <Label>Description</Label>
                <Input
                  data-testid="profit-description-input"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  placeholder="Description"
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  data-testid="profit-date-input"
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                />
              </div>

              <Button onClick={handleCreateRecord} className="w-full" data-testid="profit-submit-button">
                Add Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-red-600">${totalExpense.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-primary mr-3" />
              <div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                  ${netProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="monthly">Monthly View</TabsTrigger>
              <TabsTrigger value="yearly">Yearly View</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            record.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {record.type}
                        </span>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.company_name || record.company_text || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">${record.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="monthly">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(monthlyData)
                    .reverse()
                    .map(([month, data]) => (
                      <TableRow key={month}>
                        <TableCell className="font-semibold">{month}</TableCell>
                        <TableCell className="text-right text-green-600">${data.income.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-red-600">${data.expense.toFixed(2)}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            data.income - data.expense >= 0 ? 'text-primary' : 'text-red-600'
                          }`}
                        >
                          ${(data.income - data.expense).toFixed(2)}
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
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(yearlyData)
                    .reverse()
                    .map(([year, data]) => (
                      <TableRow key={year}>
                        <TableCell className="font-semibold">{year}</TableCell>
                        <TableCell className="text-right text-green-600">${data.income.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-red-600">${data.expense.toFixed(2)}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            data.income - data.expense >= 0 ? 'text-primary' : 'text-red-600'
                          }`}
                        >
                          ${(data.income - data.expense).toFixed(2)}
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

export default ProfitTable;
