import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Building2, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CompanyCreate = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    username: '',
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
    } catch (error) {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name || !newCompany.username || !newCompany.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate hex color
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (!hexRegex.test(newCompany.brand_color_hex)) {
      toast.error('Invalid hex color format');
      return;
    }

    try {
      await axios.post(`${API_URL}/companies`, newCompany);
      toast.success('Company created successfully!');
      setDialogOpen(false);
      setNewCompany({ name: '', username: '', password: '', brand_color_hex: '#1CFF00', contact_info: '' });
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create company');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      await axios.delete(`${API_URL}/companies/${companyId}`);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  return (
    <div className="space-y-6" data-testid="company-create">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Company Management
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Create and manage company accounts
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="create-company-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  data-testid="company-name-input"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <Label>Username</Label>
                <Input
                  data-testid="company-username-input"
                  value={newCompany.username}
                  onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                  placeholder="acmecorp"
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  data-testid="company-password-input"
                  type="password"
                  value={newCompany.password}
                  onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>

              <div>
                <Label>Brand Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    data-testid="company-color-input"
                    value={newCompany.brand_color_hex}
                    onChange={(e) => setNewCompany({ ...newCompany, brand_color_hex: e.target.value })}
                    placeholder="#1CFF00"
                  />
                  <div
                    className="w-12 h-10 rounded border-2 border-slate-200"
                    style={{ backgroundColor: newCompany.brand_color_hex }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Used for calendar events and tags</p>
              </div>

              <div>
                <Label>Contact Info (Optional)</Label>
                <Input
                  value={newCompany.contact_info}
                  onChange={(e) => setNewCompany({ ...newCompany, contact_info: e.target.value })}
                  placeholder="contact@acmecorp.com"
                />
              </div>

              <Button onClick={handleCreateCompany} className="w-full" data-testid="company-submit-button">
                Create Company
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No companies yet. Create your first company!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Brand Color</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} data-testid={`company-row-${company.id}`}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-slate-200"
                          style={{ backgroundColor: company.brand_color_hex }}
                        ></div>
                        <span className="text-xs text-slate-600">{company.brand_color_hex}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{company.contact_info || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCompany(company.id)}
                        data-testid={`delete-company-${company.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
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

export default CompanyCreate;
