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
import { toast } from 'sonner';
import { Plus, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const FirmaAkisi = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    feed_type: 'firma_akisi',
    target_company: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPosts();
    fetchCompanies();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      const firmaPosts = response.data.filter(p => p.feed_type === 'firma_akisi');
      setPosts(firmaPosts);
      console.log('[FirmaAkisi] Posts loaded:', firmaPosts.length);
    } catch (error) {
      console.error('[FirmaAkisi] Error fetching posts:', error);
      toast.error('Gönderiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
      console.log('[FirmaAkisi] Companies loaded:', response.data.length);
    } catch (error) {
      console.error('[FirmaAkisi] Error fetching companies:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      if (!newPost.title || !newPost.content || !newPost.target_company) {
        toast.error(t('fillAllFields'));
        return;
      }

      const response = await axios.post(`${API_URL}/posts`, newPost);
      toast.success(t('postCreated'));
      setDialogOpen(false);
      setNewPost({
        title: '',
        content: '',
        feed_type: 'firma_akisi',
        target_company: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchPosts();
      console.log('[FirmaAkisi] Post created:', response.data);
    } catch (error) {
      console.error('[FirmaAkisi] Error creating post:', error);
      toast.error('Gönderi oluşturulamadı');
    }
  };

  const handleMediaUpload = async (postId, file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.post(`${API_URL}/posts/${postId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Görsel yüklendi');
      fetchPosts();
    } catch (error) {
      console.error('[FirmaAkisi] Error uploading media:', error);
      toast.error('Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      if (!window.confirm(t('deleteConfirm'))) return;
      
      await axios.delete(`${API_URL}/posts/${postId}`);
      toast.success(t('deleted'));
      fetchPosts();
    } catch (error) {
      console.error('[FirmaAkisi] Error deleting post:', error);
      toast.error('Gönderi silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('firmaAkisiTitle')}</h1>
          <p className="text-gray-600 mt-1">{t('firmaAkisiSubtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-black" data-testid="new-post-button">
              <Plus className="w-4 h-4 mr-2" />
              {t('yeniGonderi')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('yeniGonderi')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{t('company')}</Label>
                <Select
                  value={newPost.target_company || ''}
                  onValueChange={(value) => setNewPost({ ...newPost, target_company: value })}
                >
                  <SelectTrigger data-testid="company-select">
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('select')}</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('subject')}</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Gönderi başlığı"
                  data-testid="post-title"
                />
              </div>

              <div>
                <Label>{t('text')}</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Gönderi içeriği"
                  rows={6}
                  data-testid="post-content"
                />
              </div>

              <div>
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  value={newPost.date}
                  onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
                  data-testid="post-date"
                />
              </div>

              <Button onClick={handleCreatePost} className="w-full" data-testid="submit-post">
                {t('create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('noPosts')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {post.creator_name} • {format(new Date(post.created_at), 'dd.MM.yyyy HH:mm')}
                    </p>
                    {post.company_name && (
                      <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                        {post.company_name}
                      </span>
                    )}
                  </div>
                  {user?.role === 'Yönetici' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
                {post.media && (
                  <img
                    src={process.env.REACT_APP_BACKEND_URL + post.media}
                    alt="Post media"
                    className="rounded-lg w-full max-h-96 object-cover"
                  />
                )}
                {!post.media && user?.role === 'Yönetici' && (
                  <div className="mt-4">
                    <Label htmlFor={`media-${post.id}`} className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-accent transition-colors">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Görsel ekle</p>
                      </div>
                    </Label>
                    <Input
                      id={`media-${post.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleMediaUpload(post.id, e.target.files[0]);
                        }
                      }}
                      disabled={uploading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FirmaAkisi;
