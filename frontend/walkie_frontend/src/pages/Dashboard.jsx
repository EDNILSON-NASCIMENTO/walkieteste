import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Trophy, 
  Heart, 
  Clock, 
  Route,
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/users/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { recent_walks = [], today_stats = {}, recent_badges = [], total_points = 0 } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Acompanhe seu progresso e conquistas</p>
        </div>
        <Link to="/walk">
          <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
            <MapPin className="w-4 h-4 mr-2" />
            Iniciar Passeio
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passeios Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{today_stats.walks_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {today_stats.walks_count > 0 ? 'Ótimo trabalho!' : 'Que tal um passeio?'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distância Hoje</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{today_stats.distance || 0} km</div>
            <p className="text-xs text-muted-foreground">
              Distância percorrida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{today_stats.points || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pontos conquistados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_points}</div>
            <p className="text-xs text-muted-foreground">
              Pontos acumulados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Walks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Passeios Recentes
            </CardTitle>
            <CardDescription>
              Seus últimos passeios realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent_walks.length > 0 ? (
              <div className="space-y-4">
                {recent_walks.slice(0, 3).map((walk) => (
                  <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {walk.distance ? `${(walk.distance / 1000).toFixed(2)} km` : 'Distância não registrada'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {walk.duration ? `${Math.floor(walk.duration / 60)} min` : 'Duração não registrada'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">+{walk.points_earned || 0} pts</p>
                      <p className="text-xs text-gray-500">
                        {new Date(walk.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to="/history">
                  <Button variant="outline" className="w-full">
                    Ver Histórico Completo
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum passeio realizado ainda</p>
                <Link to="/walk">
                  <Button className="mt-4">Fazer Primeiro Passeio</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Conquistas Recentes
            </CardTitle>
            <CardDescription>
              Badges conquistados recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent_badges.length > 0 ? (
              <div className="space-y-4">
                {recent_badges.map((userBadge) => (
                  <div key={userBadge.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{userBadge.badge?.name}</p>
                      <p className="text-sm text-gray-600">{userBadge.badge?.description}</p>
                    </div>
                    <Badge variant="secondary">Novo!</Badge>
                  </div>
                ))}
                <Link to="/ranking">
                  <Button variant="outline" className="w-full">
                    Ver Todas as Conquistas
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma conquista ainda</p>
                <p className="text-sm text-gray-500 mt-2">
                  Faça passeios para conquistar badges!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/walk">
              <Button className="w-full h-20 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                <div className="text-center">
                  <MapPin className="w-6 h-6 mx-auto mb-1" />
                  <span>Iniciar Passeio</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/pets">
              <Button variant="outline" className="w-full h-20">
                <div className="text-center">
                  <Heart className="w-6 h-6 mx-auto mb-1" />
                  <span>Gerenciar Pets</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/ranking">
              <Button variant="outline" className="w-full h-20">
                <div className="text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-1" />
                  <span>Ver Ranking</span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

