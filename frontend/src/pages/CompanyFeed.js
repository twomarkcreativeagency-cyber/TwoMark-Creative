import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CompanyFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      // Filter for company feed posts
      const companyPosts = response.data.filter((post) => post.feed_type === 'company');
      setPosts(companyPosts);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="company-feed">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Company Feed
        </h1>
        <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {user?.role === 'CompanyUser'
            ? 'Updates specifically for your company'
            : 'Company-specific updates and announcements'}
        </p>
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
              <p className="text-slate-500">No company posts yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`company-post-${post.id}`}>
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
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    Company Feed
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

export default CompanyFeed;
