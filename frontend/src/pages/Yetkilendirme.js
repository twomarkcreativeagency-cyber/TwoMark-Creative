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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Users, Trash2, Shield } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Yetkilendirme = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'Editör',
  });

  const roles = ['Yönetici', 'Editör', 'Firma'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
      console.log('[Yetkilendirme] Users loaded:', response.data.length);
    } catch (error) {
      console.error('[Yetkilendirme] Error fetching users:', error);
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.full_name || !newUser.username || !newUser.password || !newUser.role) {
        toast.error(t('fillAllFields'));
        return;
      }

      await axios.post(`${API_URL}/users`, newUser);
      toast.success(t('userCreated'));
      setDialogOpen(false);
      setNewUser({
        full_name: '',
        username: '',
        password: '',
        role: 'Editör',
      });
      fetchUsers();
    } catch (error) {
      console.error('[Yetkilendirme] Error creating user:', error);
      toast.error(error.response?.data?.detail || 'Kullanıcı oluşturulamadı');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      if (!window.confirm(t('deleteConfirm'))) return;

      await axios.delete(`${API_URL}/users/${userId}`);
      toast.success(t('deleted'));
      fetchUsers();
    } catch (error) {
      console.error('[Yetkilendirme] Error deleting user:', error);
      toast.error('Kullanıcı silinemedi');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/users/${userId}`, { role: newRole });
      toast.success(t('updated'));
      fetchUsers();
    } catch (error) {
      console.error('[Yetkilendirme] Error updating role:', error);
      toast.error('Rol güncellenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('yetkilendirmeTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('yetkilendirmeSubtitle')}</p>
        </div>
        {currentUser?.role === 'Yönetici' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-black" data-testid="new-user-button">
                <Plus className="w-4 h-4 mr-2" />
                {t('yeniKullanici')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('yeniKullanici')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('fullName')}</Label>
                  <Input
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="Ad Soyad"
                  />
                </div>

                <div>
                  <Label>{t('username')}</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Kullanıcı adı"
                  />
                </div>

                <div>
                  <Label>{t('password')}</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Şifre"
                  />
                </div>

                <div>
                  <Label>{t('role')}</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateUser} className="w-full">
                  {t('create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Yöneticiler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-red-500 mr-3" />
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'Yönetici').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Editörler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-accent mr-3" />
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'Editör').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users')}</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('noUsers')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fullName')}</TableHead>
                  <TableHead>{t('username')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {currentUser?.role === 'Yönetici' && user.id !== currentUser.id ? (
                        <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'Yönetici'
                              ? 'bg-red-100 text-red-700'
                              : user.role === 'Editör'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentUser?.role === 'Yönetici' && user.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Yetkilendirme;
