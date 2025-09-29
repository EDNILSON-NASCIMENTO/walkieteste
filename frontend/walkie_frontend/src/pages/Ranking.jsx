import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Target,
  Calendar,
  TrendingUp,
  Star
} from 'lucide-react';

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rankingRes, badgesRes, challengesRes] = await Promise.all([
        axios.get(`/api/gamification/ranking?period=${selectedPeriod}`),
        axios.get('/api/gamification/badges'),
        axios.get('/api/gamification/challenges')
      ]);

      setRanking(rankingRes.data);
      setBadges(badgesRes.data);
      setChallenges(challengesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">{position}</span>;
    }
  };

  const getBadgeIcon = (earned) => {
    return earned ? (
      <Trophy className="w-8 h-8 text-yellow-500" />
    ) : (
      <Trophy className="w-8 h-8 text-gray-300" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ranking & Conquistas</h1>
          <p className="text-gray-600">Veja sua posição e conquiste novos badges</p>
        </div>
      </div>

      <Tabs defaultValue="ranking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="challenges">Desafios</TabsTrigger>
        </TabsList>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Classificação</h2>
            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('weekly')}
              >
                Semanal
              </Button>
              <Button
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('monthly')}
              >
                Mensal
              </Button>
              <Button
                variant={selectedPeriod === 'all_time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all_time')}
              >
                Geral
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Top Caminhantes
              </CardTitle>
              <CardDescription>
                Ranking baseado nos pontos conquistados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ranking.ranking && ranking.ranking.length > 0 ? (
                <div className="space-y-4">
                  {ranking.ranking.map((user) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        user.is_current_user 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {getRankIcon(user.position)}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                            {user.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.name}
                              {user.is_current_user && (
                                <Badge variant="secondary" className="ml-2">Você</Badge>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">#{user.position}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-600">{user.points}</p>
                        <p className="text-sm text-gray-600">pontos</p>
                      </div>
                    </div>
                  ))}

                  {ranking.current_user_position > 10 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10">
                            <span className="text-sm font-bold text-gray-600">
                              #{ranking.current_user_position}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">Sua posição atual</p>
                            <Badge variant="secondary">Você</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum dado de ranking disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Conquistas
              </CardTitle>
              <CardDescription>
                Badges que você pode conquistar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-lg border ${
                        badge.earned 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-3">
                          {getBadgeIcon(badge.earned)}
                        </div>
                        <h3 className={`font-semibold ${badge.earned ? 'text-yellow-700' : 'text-gray-600'}`}>
                          {badge.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {badge.description}
                        </p>
                        {badge.earned && badge.earned_at && (
                          <p className="text-xs text-yellow-600 mt-2">
                            Conquistado em {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {!badge.earned && badge.points_required > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Requer {badge.points_required} pontos
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum badge disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Desafios Ativos
              </CardTitle>
              <CardDescription>
                Complete desafios para ganhar pontos extras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {challenges.length > 0 ? (
                <div className="space-y-4">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-lg border ${
                        challenge.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{challenge.title}</h3>
                            {challenge.completed && (
                              <Badge className="bg-green-500">Completo!</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {challenge.description}
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progresso</span>
                              <span>
                                {challenge.type === 'daily' && `${challenge.progress}/${challenge.target}`}
                                {challenge.type === 'weekly' && `${(challenge.progress / 1000).toFixed(1)}/${(challenge.target / 1000).toFixed(1)} km`}
                                {challenge.type === 'monthly' && `${(challenge.progress / 1000).toFixed(1)}/${(challenge.target / 1000).toFixed(1)} km`}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{
                                  width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="flex items-center text-yellow-600">
                            <Star className="w-4 h-4 mr-1" />
                            <span className="font-bold">+{challenge.reward_points}</span>
                          </div>
                          <p className="text-xs text-gray-500">pontos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum desafio disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Ranking;

