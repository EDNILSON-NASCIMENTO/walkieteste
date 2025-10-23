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
  
  // Estado para os dados de TEXTO do formulário
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    preferences: ''
    // profile_picture foi removido daqui
  });

  // (NOVO) States para gerenciar o upload da imagem
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    setError('');
    setPets([]);
    setLoading(true);
    try {
      const response = await axios.get('/users/pets'); 
      if (Array.isArray(response.data)) {
        setPets(response.data);
      } else {
        console.warn('A API /api/users/pets não retornou um array:', response.data);
        setPets([]);
      }
    } catch (error) {
      console.error('Erro ao carregar pets:', error);
      setError(error.response?.data?.error || 'Erro ao carregar pets');
      setPets([]); 
    } finally {
      setLoading(false);
    }
  };

  // Handler para mudanças em inputs de TEXTO
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // (NOVO) Handler para mudanças em inputs de ARQUIVO
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Cria uma URL local temporária para o preview
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // (NOVO) Função helper para fazer o upload da imagem
  const uploadPetImage = async (petId, file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('profile_picture', file);

    // Envia o arquivo para a nova rota de upload
    await axios.post(
      `/users/pets/${petId}/upload`, 
      uploadFormData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  };

  // (ATUALIZADO) handleSubmit com lógica de 2 etapas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      // 1. Prepara os dados de TEXTO
      const textData = {
        name: formData.name,
        breed: formData.breed,
        age: formData.age || null,
        weight: formData.weight || null,
        preferences: formData.preferences,
      };

      if (editingPet) {
        // --- LÓGICA DE ATUALIZAÇÃO ---
        // 2a. Envia os dados de TEXTO
        await axios.put(`/users/pets/${editingPet.id}`, textData);
        
        // 3a. Se houver arquivo, envia a IMAGEM
        if (selectedFile) {
          await uploadPetImage(editingPet.id, selectedFile);
        }
        setMessage('Pet atualizado com sucesso!');
        
      } else {
        // --- LÓGICA DE CRIAÇÃO ---
        // 2b. Envia os dados de TEXTO
        const response = await axios.post('/users/pets', textData);
        const newPetId = response.data.pet.id; // Pega o ID do pet recém-criado
        
        // 3b. Se houver arquivo, envia a IMAGEM
        if (selectedFile) {
          await uploadPetImage(newPetId, selectedFile);
        }
        setMessage('Pet cadastrado com sucesso!');
      }
      
      // 4. Recarrega a lista e limpa o formulário
      await fetchPets();
      handleCancel();

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar pet');
    } finally {
      setSaving(false);
    }
  };

  // (ATUALIZADO) handleEdit
  const handleEdit = (pet) => {
    setEditingPet(pet);
    // Preenche o form só com dados de texto
    setFormData({
      name: pet.name || '',
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      weight: pet.weight?.toString() || '',
      preferences: pet.preferences || ''
    });
    // Define o preview da imagem
    setImagePreview(pet.profile_picture || null);
    setSelectedFile(null); // Limpa seleção de arquivo anterior
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

  // (ATUALIZADO) handleCancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingPet(null);
    setFormData({
      name: '',
      breed: '',
      age: '',
      weight: '',
      preferences: ''
    });
    setError('');
    // Limpa os states de imagem
    setSelectedFile(null);
    setImagePreview(null);
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
      {/* ... (Header e Alertas - Sem alteração) ... */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pets</h1>
          <p className="text-gray-600">Gerencie as informações dos seus companheiros</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              handleCancel(); // Limpa o form antes de abrir
              setShowForm(true);
            }}
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

      {/* (ATUALIZADO) Pet Form */}
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
              
              {/* (NOVO) Preview da Imagem */}
              {imagePreview && (
                <div className="flex justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview do pet"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ... (Inputs de Name, Breed, Age, Weight - Sem alteração) ... */}
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

              {/* (ATUALIZADO) Input de Imagem */}
              <div className="space-y-2">
                <Label htmlFor="profile_picture">
                  {editingPet ? 'Alterar Foto' : 'Adicionar Foto'}
                </Label>
                <Input
                  id="profile_picture"
                  name="profile_picture"
                  type="file" // MUDANÇA IMPORTANTE
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleFileChange} // MUDANÇA IMPORTANTE
                />
              </div>

              {/* ... (Input de Preferences e Botões - Sem alteração) ... */}
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

      {/* (ATUALIZADO) Pets List */}
      {pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  {pet.profile_picture ? (
                    <img
                      src={pet.profile_picture} // A lista exibe a foto do banco
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
              {/* ... (Resto do CardContent - Sem alteração) ... */}
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
        // ... (Card de "Nenhum pet" - Sem alteração) ...
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
                onClick={() => {
                  handleCancel(); // Limpa o form antes de abrir
                  setShowForm(true);
                }}
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