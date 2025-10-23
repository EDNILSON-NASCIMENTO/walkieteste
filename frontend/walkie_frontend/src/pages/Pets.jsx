import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Dog
} from 'lucide-react';

const Pets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    profile_picture: '',
    preferences: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPets();
  }, []);

  // --- INÍCIO DA CORREÇÃO ---
  const fetchPets = async () => {
    // Limpa erros anteriores e garante que pets seja um array
    setError('');
    setPets([]);
    setLoading(true); // Garante o estado de loading

    try {
      const response = await axios.get('/users/pets');

      // Verificação crucial:
      // Garante que o estado 'pets' só será atualizado se a resposta for um array
      if (Array.isArray(response.data)) {
        setPets(response.data);
      } else {
        // Se a API retornar algo inesperado (null, {}, etc.), 
        // loga um aviso e mantém 'pets' como um array vazio.
        console.warn('A API /api/users/pets não retornou um array:', response.data);
        setPets([]);
      }

    } catch (error) {
      console.error('Erro ao carregar pets:', error);
      setError(error.response?.data?.error || 'Erro ao carregar pets');
      // Garante que 'pets' seja um array vazio em caso de erro
      setPets([]); 
    } finally {
      setLoading(false);
    }
  };
  // --- FIM DA CORREÇÃO ---

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingPet) {
        await axios.put(`/users/pets/${editingPet.id}`, formData);
        setMessage('Pet atualizado com sucesso!');
      } else {
        await axios.post('/users/pets', formData);
        setMessage('Pet cadastrado com sucesso!');
      }
      
      await fetchPets();
      handleCancel();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar pet');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || '',
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      weight: pet.weight?.toString() || '',
      profile_picture: pet.profile_picture || '',
      preferences: pet.preferences || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (petId) => {
    if (!window.confirm('Tem certeza que deseja remover este pet?')) {
      return;
    }

    try {
      await axios.delete(`/users/pets/${petId}`);
      setMessage('Pet removido com sucesso!');
      await fetchPets();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao remover pet');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPet(null);
    setFormData({
      name: '',
      breed: '',
      age: '',
      weight: '',
      profile_picture: '',
      preferences: ''
    });
    setError('');
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
          <h1 className="text-3xl font-bold text-gray-900">Meus Pets</h1>
          <p className="text-gray-600">Gerencie as informações dos seus companheiros</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Pet
          </Button>
        )}
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

      {/* Pet Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPet ? 'Editar Pet' : 'Adicionar Novo Pet'}
            </CardTitle>
            <CardDescription>
              Preencha as informações do seu pet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nome do pet"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Raça</Label>
                  <Input
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    placeholder="Raça do pet"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Idade em anos"
                    min="0"
                    max="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Peso em kg"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_picture">URL da Foto</Label>
                <Input
                  id="profile_picture"
                  name="profile_picture"
                  value={formData.profile_picture}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/foto-pet.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferences">Preferências e Características</Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  value={formData.preferences}
                  onChange={handleChange}
                  placeholder="Ex: Tem medo de outros cães, prefere parques, gosta de água..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : (editingPet ? 'Atualizar' : 'Cadastrar')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pets List */}
      {pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  {pet.profile_picture ? (
                    <img
                      src={pet.profile_picture}
                      alt={pet.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <Heart className="w-10 h-10 text-white" />
                  )}
                </div>
                <CardTitle className="text-xl">{pet.name}</CardTitle>
                {pet.breed && (
                  <CardDescription>{pet.breed}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {pet.age && (
                    <div>
                      <span className="font-medium">Idade:</span>
                      <p className="text-gray-600">{pet.age} anos</p>
                    </div>
                  )}
                  {pet.weight && (
                    <div>
                      <span className="font-medium">Peso:</span>
                      <p className="text-gray-600">{pet.weight} kg</p>
                    </div>
                  )}
                </div>

                {pet.preferences && (
                  <div>
                    <span className="font-medium text-sm">Características:</span>
                    <p className="text-gray-600 text-sm mt-1">{pet.preferences}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pet)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pet.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="text-center py-12">
              <Dog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pet cadastrado
              </h3>
              <p className="text-gray-600 mb-6">
                Adicione seu primeiro pet para começar a usar o Walkie
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Pet
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default Pets;