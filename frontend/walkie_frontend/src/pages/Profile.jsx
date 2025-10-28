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
  X,
  CalendarDays,
  Route,
  TrendingUp,
  AlertTriangle // Importado
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- FUNÇÃO getImageUrl CORRIGIDA (Frontend Fix) ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // Verifica se imagePath já é uma URL completa
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log("Profile.getImageUrl: Path já é URL completa:", imagePath);
      return imagePath; // Retorna a URL completa como está
    }

    // Se não for completa, constrói a URL
    const baseUrlWithoutApi = axios.defaults.baseURL.replace('/api', '');
    const fullUrl = `${baseUrlWithoutApi.replace(/\/$/, '')}/${imagePath.replace(/^\//, '')}`;
    console.log("Profile.getImageUrl: Construindo URL:", imagePath, "->", fullUrl);
    return fullUrl;
  };
  // --- FIM DA FUNÇÃO ---

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const response = await axios.get('/users/profile');
        setProfile(response.data);

        setFormData({
          name: response.data.name || '',
        });

        // Usa a função getImageUrl corrigida
        setImagePreview(getImageUrl(response.data.profile_picture));

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file)); // Preview local
    } else {
      setSelectedFile(null);
      setImagePreview(getImageUrl(profile?.profile_picture)); // Reverte preview
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    let updatedUser = profile;

    try {
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('profile_picture', selectedFile);

        const uploadResponse = await axios.post(
          '/users/profile/upload',
          uploadFormData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        updatedUser = uploadResponse.data.user;
        setSelectedFile(null);
      }

      // Só atualiza o nome se ele mudou
      if (formData.name !== profile?.name) {
          const response = await axios.put('/users/profile', { name: formData.name });
          // Garante que updatedUser tenha a versão mais recente após a atualização do nome
          // Se o upload já ocorreu, usa os dados dele, senão usa os dados da atualização do nome
          updatedUser = response.data.user;
      }

      setProfile(updatedUser);
      updateUser(updatedUser);
      setEditing(false);

      // Atualiza o preview com a URL FINAL vinda do backend (usando a função corrigida)
      setImagePreview(getImageUrl(updatedUser.profile_picture));

      setMessage('Perfil atualizado com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar perfil:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Erro ao atualizar perfil');
      // Reverte o preview em caso de erro
      setImagePreview(getImageUrl(profile?.profile_picture));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
    });
    setEditing(false);
    setError('');
    setMessage('');
    setSelectedFile(null);
    // Reverte o preview usando a função corrigida
    setImagePreview(getImageUrl(profile?.profile_picture));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !profile) {
    return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /> <AlertDescription>{error}</AlertDescription></Alert>;
  }

  const { statistics = {} } = profile || {};

  return (
    <div className="space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && editing && (
        <Alert variant="destructive">
           <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grid Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="flex items-center text-xl">
                  <User className="w-5 h-5 mr-2" /> Informações Pessoais
                </CardTitle>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="w-full sm:w-auto">
                    <Edit className="w-4 h-4 mr-2" /> Editar
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                      <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancel} className="w-full sm:w-auto">
                      <X className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Foto do perfil" className="w-full h-full object-cover" key={imagePreview} />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  {editing ? (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Seu nome" className="text-base" />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold break-words">{profile?.name}</h3>
                      <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1 break-all">
                        <Mail className="w-4 h-4 mr-1 flex-shrink-0" /> {profile?.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {editing && (
                <div className="space-y-1.5">
                  <Label htmlFor="profile_picture">Alterar Foto do Perfil</Label>
                  <Input id="profile_picture" name="profile_picture" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                   <p className="text-xs text-muted-foreground">PNG, JPG ou GIF.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><Trophy className="w-5 h-5 mr-2" /> Estatísticas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{statistics.total_walks || 0}</div>
                <p className="text-xs sm:text-sm text-gray-600">Passeios</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <Route className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-green-600">{statistics.total_distance?.toFixed(1) || '0.0'} km</div>
                <p className="text-xs sm:text-sm text-gray-600">Distância</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{statistics.total_badges || 0}</div>
                <p className="text-xs sm:text-sm text-gray-600">Badges</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-1 sm:mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{profile?.total_points || 0}</div>
                <p className="text-xs sm:text-sm text-gray-600">Pontos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><CalendarDays className="w-5 h-5 mr-2" /> Membro desde</CardTitle></CardHeader>
            <CardContent><p className="text-gray-600 text-sm sm:text-base">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Data não disponível'}</p></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;