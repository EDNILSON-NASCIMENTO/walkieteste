import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Trophy, 
  MapPin, 
  Award,
  Edit,
  Save,
  X
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profile_picture: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/users/profile');
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          profile_picture: response.data.profile_picture || ''
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setError('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put('/users/profile', formData);
      setProfile(response.data.user);
      updateUser(response.data.user);
      setEditing(false);
      setMessage('Perfil atualizado com sucesso!');
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      profile_picture: profile?.profile_picture || ''
    });
    setEditing(false);
    setError('');
    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { statistics = {} } = profile || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
                {!editing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  {profile?.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt="Foto do perfil"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold">{profile?.name}</h3>
                      <p className="text-gray-600 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {profile?.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {editing && (
                <div className="space-y-2">
                  <Label htmlFor="profile_picture">URL da Foto do Perfil</Label>
                  <Input
                    id="profile_picture"
                    name="profile_picture"
                    value={formData.profile_picture}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.total_walks || 0}
                </div>
                <p className="text-sm text-gray-600">Passeios Realizados</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {statistics.total_distance || 0} km
                </div>
                <p className="text-sm text-gray-600">Distância Total</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {statistics.total_badges || 0}
                </div>
                <p className="text-sm text-gray-600">Badges Conquistados</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {profile?.total_points || 0}
                </div>
                <p className="text-sm text-gray-600">Pontos Totais</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membro desde</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {profile?.created_at ? 
                  new Date(profile.created_at).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 
                  'Data não disponível'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

