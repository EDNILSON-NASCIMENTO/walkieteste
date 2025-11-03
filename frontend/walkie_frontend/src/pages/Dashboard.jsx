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
       setLoading(true);
      try {
        // *** CORREÇÃO AQUI ***
        // Removemos a verificação manual do token e o objeto 'config'.
        // O AuthContext já configurou o 'axios' globalmente.
        const response = await axios.get('/users/dashboard'); 
        // *** FIM DA CORREÇÃO ***
        
        setDashboardData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error.response?.data || error.message);
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

  // Handle case where dashboardData might still be null after loading (e.g., error)
  if (!dashboardData) {
      return (
        <div className="text-center text-red-600">
          Erro ao carregar os dados do dashboard. Tente recarregar a página.
        </div>
      );
  }


  const { recent_walks = [], today_stats = {}, recent_badges = [], total_points = 0 } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> {/* Adjust layout for small screens */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Acompanhe seu progresso e conquistas</p>
        </div>
        <Link to="/walk" className="w-full sm:w-auto"> {/* Make button full width on small screens */}
          <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
            <MapPin className="w-4 h-4 mr-2" />
            Iniciar Passeio
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {/* Grid adjusts columns based on screen size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passeios Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{today_stats?.walks_count || 0}</div> {/* Added safe navigation */}
            <p className="text-xs text-muted-foreground">
              {(today_stats?.walks_count || 0) > 0 ? 'Ótimo trabalho!' : 'Que tal um passeio?'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distância Hoje</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{today_stats?.distance?.toFixed(2) || '0.00'} km</div> {/* Added safe navigation and formatting */}
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
            <div className="text-2xl font-bold">{today_stats?.points || 0}</div> {/* Added safe navigation */}
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
            <div className="text-2xl font-bold">{total_points || 0}</div> {/* Use || 0 as fallback */}
            <p className="text-xs text-muted-foreground">
              Pontos acumulados
            </p>
          </CardContent>
        </Card>
      </div>

       {/* Grid adjusts columns based on screen size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
            {/* Ensure recent_walks is an array before mapping */}
            {Array.isArray(recent_walks) && recent_walks.length > 0 ? (
              <div className="space-y-4">
                {recent_walks.slice(0, 3).map((walk) => (
                  <div key={walk.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"> {/* Added border */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0"> {/* Added flex-shrink-0 */}
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0"> {/* Allow text to wrap */}
                        <p className="font-medium truncate"> {/* Added truncate */}
                          {walk.distance ? `${(walk.distance / 1000).toFixed(2)} km` : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {walk.duration ? `${Math.floor(walk.duration / 60)} min` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
                      <p className="font-medium text-blue-600">+{walk.points_earned || 0} pts</p>
                      <p className="text-xs text-gray-500">
                        {walk.created_at ? new Date(walk.created_at).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                ))}
                {recent_walks.length > 3 && ( // Only show if there are more walks
                     <Link to="/history">
                       <Button variant="outline" className="w-full mt-2">
                         Ver Histórico Completo
                       </Button>
                     </Link>
                   )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum passeio realizado ainda</p>
                <Link to="/walk">
                  <Button className="mt-4 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">Fazer Primeiro Passeio</Button> {/* Added gradient */}
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
            {/* Ensure recent_badges is an array before mapping */}
            {Array.isArray(recent_badges) && recent_badges.length > 0 ? (
              <div className="space-y-4">
                {recent_badges.map((userBadge) => (
                  <div key={userBadge.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0"> {/* Added flex-shrink-0 */}
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0"> {/* Allow text to wrap */}
                      <p className="font-medium truncate">{userBadge.badge?.name || 'Badge Desconhecido'}</p> {/* Added fallback and truncate */}
                      <p className="text-sm text-gray-600 line-clamp-2">{userBadge.badge?.description || ''}</p> {/* Added line-clamp */}
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">Novo!</Badge> {/* Added flex-shrink-0 */}
                  </div>
                ))}
                <Link to="/ranking">
                  <Button variant="outline" className="w-full mt-2">
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
          {/* Grid adjusts columns, buttons stack vertically on small screens */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/walk">
              <Button className="w-full h-20 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-lg"> {/* Increased text size */}
                <div className="flex flex-col items-center justify-center">
                  <MapPin className="w-6 h-6 mb-1" />
                  <span>Iniciar Passeio</span>
                </div>
              </Button>
            </Link>

            <Link to="/pets">
              <Button variant="outline" className="w-full h-20 text-lg"> {/* Increased text size */}
                 <div className="flex flex-col items-center justify-center">
                  <Heart className="w-6 h-6 mb-1" />
                  <span>Gerenciar Pets</span>
                </div>
              </Button>
            </Link>

            <Link to="/ranking">
              <Button variant="outline" className="w-full h-20 text-lg"> {/* Increased text size */}
                 <div className="flex flex-col items-center justify-center">
                  <Trophy className="w-6 h-6 mb-1" />
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