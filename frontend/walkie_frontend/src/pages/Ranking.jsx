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
  Star,
  User, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';

const Ranking = () => {
  const [rankingData, setRankingData] = useState({ ranking: [], current_user_position: null }); 
  const [badges, setBadges] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData(selectedPeriod); 
  }, [selectedPeriod]); 

  const fetchData = async (period) => { 
    setLoading(true);
    setError('');
    try {
      // *** CORREÇÃO AQUI ***
      // Removemos o 'config'. Axios já está autenticado.
      const [rankingRes, badgesRes, challengesRes] = await Promise.all([
        axios.get(`/api/gamification/ranking?period=${period}`), 
        axios.get('/api/gamification/badges'),                
        axios.get('/api/gamification/challenges')             
      ]);
      // *** FIM DA CORREÇÃO ***

      setRankingData(rankingRes.data || { ranking: [], current_user_position: null });
      setBadges(Array.isArray(badgesRes.data) ? badgesRes.data : []);
      setChallenges(Array.isArray(challengesRes.data) ? challengesRes.data : []);

    } catch (err) { 
      console.error('Erro ao carregar dados de gamificação:', err.response?.data || err.message);
      setError('Falha ao carregar dados. Tente novamente.');
      setRankingData({ ranking: [], current_user_position: null });
      setBadges([]);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };


   const getRankIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-600">{position}</span>;
    }
  };

  const getBadgeIcon = (earned) => (
    earned
      ? <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
      : <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
  );

  const formatChallengeProgress = (challenge) => {
      const progress = challenge.progress || 0;
      const target = challenge.target || 1; 
      const percentage = Math.min(Math.max(0, (progress / target) * 100), 100);

      let progressText = '';
      if (challenge.type === 'daily') {
          progressText = `${progress}/${target}`;
      } else if (challenge.type === 'weekly' || challenge.type === 'monthly') {
          progressText = `${(progress / 1000).toFixed(1)} / ${(target / 1000).toFixed(1)} km`;
      } else {
          progressText = `${progress}/${target}`; 
      }

      return { percentage, progressText };
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ranking & Conquistas</h1>
          <p className="text-gray-600 mt-1">Veja sua posição e conquiste novos badges</p>
        </div>
      </div>

       {loading && (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" /> 
            </div>
       )}
       {error && !loading && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
       )}


      {!loading && !error && (
          <Tabs defaultValue="ranking" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto"> 
              <TabsTrigger value="ranking" className="py-2 text-sm sm:text-base">Ranking</TabsTrigger> 
              <TabsTrigger value="badges" className="py-2 text-sm sm:text-base">Badges</TabsTrigger>
              <TabsTrigger value="challenges" className="py-2 text-sm sm:text-base">Desafios</TabsTrigger>
            </TabsList>

            {/* Ranking Tab */}
            <TabsContent value="ranking" className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-xl font-semibold">Classificação de Pontos</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Button
                    variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('weekly')}
                    className="w-full sm:w-auto"
                  >
                    Semanal
                  </Button>
                  <Button
                    variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('monthly')}
                     className="w-full sm:w-auto"
                  >
                    Mensal
                  </Button>
                  <Button
                    variant={selectedPeriod === 'all_time' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('all_time')}
                     className="w-full sm:w-auto"
                  >
                    Geral
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Trophy className="w-5 h-5 mr-2" />
                    Top Caminhantes ({
                      selectedPeriod === 'weekly' ? 'Semanal' :
                      selectedPeriod === 'monthly' ? 'Mensal' : 'Geral'
                    })
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(rankingData?.ranking) && rankingData.ranking.length > 0 ? (
                    <div className="space-y-3">
                      {rankingData.ranking.map((user) => (
                        <div
                          key={user.user_id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            user.is_current_user
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-100' 
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0"> 
                            <div className="flex-shrink-0 flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10">
                              {getRankIcon(user.position)}
                            </div>
                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center overflow-hidden">
                              {user.profile_picture ? (
                                <> 
                                  <img
                                    src={user.profile_picture}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                     onError={(e) => {
                                       e.target.style.display = 'none';
                                       if (e.target.nextSibling && e.target.nextSibling.style) {
                                          e.target.nextSibling.style.display = 'flex';
                                       }
                                     }}
                                  />
                                  <div style={{display: 'none'}} className="w-full h-full flex items-center justify-center"> 
                                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                  </div>
                                </> 
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"> 
                                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0"> 
                              <p className="font-medium text-sm sm:text-base truncate"> 
                                {user.name}
                                {user.is_current_user && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Você</Badge>
                                )}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">#{user.position}</p>
                            </div>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className="font-bold text-base sm:text-lg text-blue-600">{user.points || 0}</p>
                            <p className="text-xs sm:text-sm text-gray-600">pontos</p>
                          </div>
                        </div>
                      ))}

                       {rankingData.current_user_position && !rankingData.ranking.some(u => u.is_current_user) && (
                         <div className="border-t pt-3 mt-3">
                           <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                             <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10">
                                   <span className="text-xs sm:text-sm font-bold text-gray-600">
                                     #{rankingData.current_user_position}
                                   </span>
                                </div>
                               <div>
                                 <p className="font-medium text-sm sm:text-base">Sua posição</p>
                                  <Badge variant="secondary" className="text-xs">Você</Badge>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}

                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum dado de ranking disponível para este período.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Award className="w-5 h-5 mr-2" />
                    Minhas Conquistas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(badges) && badges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {badges.map((badge) => (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-lg border text-center ${
                            badge.earned
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-gray-50 border-gray-200 opacity-70' 
                          }`}
                        >
                          <div className="flex justify-center mb-2">
                            {getBadgeIcon(badge.earned)}
                          </div>
                          <h3 className={`font-semibold text-base mb-1 ${badge.earned ? 'text-yellow-700' : 'text-gray-700'}`}>
                            {badge.name}
                          </h3>
                          <p className="text-sm text-gray-600 leading-snug">
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum badge disponível no momento.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Target className="w-5 h-5 mr-2" />
                    Desafios Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(challenges) && challenges.length > 0 ? (
                    <div className="space-y-4">
                      {challenges.map((challenge) => {
                         const { percentage, progressText } = formatChallengeProgress(challenge);
                         return (
                            <div
                              key={challenge.id}
                              className={`p-4 rounded-lg border ${
                                challenge.completed
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0"> 
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-semibold text-base">{challenge.title}</h3>
                                    {challenge.completed && (
                                      <Badge className="bg-green-600 text-white text-xs">Completo!</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {challenge.description}
                                  </p>

                                  <div className="w-full">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>Progresso</span>
                                      <span>{progressText}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"> 
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-center sm:text-right mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                                  <div className="flex items-center justify-center sm:justify-end text-yellow-600">
                                    <Star className="w-4 h-4 mr-1 fill-current" /> 
                                    <span className="font-bold text-lg">+{challenge.reward_points || 0}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">pontos</p>
                                </div>
                              </div>
                            </div>
                         );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum desafio ativo no momento.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      )}
    </div>
  );
};

export default Ranking;