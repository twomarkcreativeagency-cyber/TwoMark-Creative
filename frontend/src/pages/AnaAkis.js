import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AnaAkis = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalCompanies: 0,
    totalPayments: 0,
    totalEvents: 0,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data for dashboard
      const [postsRes, companiesRes, paymentsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/posts`),
        axios.get(`${API_URL}/companies`),
        axios.get(`${API_URL}/payments`),
        axios.get(`${API_URL}/events`),
      ]);

      setStats({
        totalPosts: postsRes.data.length,
        totalCompanies: companiesRes.data.length,
        totalPayments: paymentsRes.data.filter(p => p.status === 'odenecek').length,
        totalEvents: eventsRes.data.length,
      });

      // Get recent posts (last 5)
      const sortedPosts = postsRes.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentPosts(sortedPosts);
    } catch (error) {
      console.error('[AnaAkis] Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('anaAkisTitle')}</h1>
        <p className="text-gray-600 mt-1">{t('anaAkisSubtitle')}</p>
        <p className="text-sm text-gray-500 mt-2">
          Hoş geldiniz, <span className="font-semibold text-accent">{user?.full_name}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('totalPosts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                <p className="text-xs text-gray-500">{t('posts')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('companies')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
                <p className="text-xs text-gray-500">{t('firms')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('pendingPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                <p className="text-xs text-gray-500">{t('payments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('upcomingEvents')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                <p className="text-xs text-gray-500">{t('events')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('noRecentActivity')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{post.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{post.creator_name}</span>
                        <span>•</span>
                        <span>{format(new Date(post.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}</span>
                        {post.company_name && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-1 bg-accent/10 text-accent rounded-full">
                              {post.company_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnaAkis;
