import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MainFeed = () => {
  const [posts, setPosts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    feed_type: 'main',
    target_companies: [],
  });

  useEffect(() => {
    fetchPosts();
    fetchCompanies();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to fetch posts');
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

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/posts`, newPost);
      toast.success('Post created successfully!');
      setDialogOpen(false);
      setNewPost({ title: '', content: '', feed_type: 'main', target_companies: [] });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="space-y-6" data-testid="main-feed">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Main Feed
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Shared updates and announcements
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="create-post-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Feed Type</Label>
                <Select
                  value={newPost.feed_type}
                  onValueChange={(value) => setNewPost({ ...newPost, feed_type: value })}
                >
                  <SelectTrigger data-testid="post-feed-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Feed</SelectItem>
                    <SelectItem value="company">Company Feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPost.feed_type === 'company' && (
                <div>
                  <Label>Target Companies</Label>
                  <Select
                    onValueChange={(value) => {
                      if (!newPost.target_companies.includes(value)) {
                        setNewPost({
                          ...newPost,
                          target_companies: [...newPost.target_companies, value],
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select companies" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPost.target_companies.map((companyId) => {
                      const company = companies.find((c) => c.id === companyId);
                      return (
                        <span
                          key={companyId}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {company?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label>Title</Label>
                <Input
                  data-testid="post-title-input"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Post title"
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  data-testid="post-content-input"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's on your mind?"
                  rows={6}
                />
              </div>

              <Button onClick={handleCreatePost} className="w-full" data-testid="post-submit-button">
                Create Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No posts yet. Create your first post!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`post-${post.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {post.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      By {post.creator_name} • {format(new Date(post.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      post.feed_type === 'main'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {post.feed_type === 'main' ? 'Main Feed' : 'Company Feed'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {post.content}
                </p>
                {post.media && (
                  <img
                    src={process.env.REACT_APP_BACKEND_URL + post.media}
                    alt="Post media"
                    className="mt-4 rounded-lg w-full max-h-96 object-cover"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainFeed;
