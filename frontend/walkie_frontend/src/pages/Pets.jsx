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
  Dog,
  AlertTriangle
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
    preferences: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- FUNÇÃO PARA CONSTRUIR URL DA IMAGEM ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const baseUrlWithoutApi = axios.defaults.baseURL.replace('/api', '');
    return `${baseUrlWithoutApi.replace(/\/$/, '')}/${imagePath.replace(/^\//, '')}`;
  };
  // --- FIM DA FUNÇÃO ---

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
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setImagePreview(getImageUrl(editingPet?.profile_picture)); // Reverte para a imagem salva (se editando)
    }
  };

  const uploadPetImage = async (petId, file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('profile_picture', file);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    let savedPetData = null; // Para armazenar os dados do pet após salvar/atualizar texto

    try {
      const textData = {
        name: formData.name,
        breed: formData.breed,
        age: formData.age || null,
        weight: formData.weight || null,
        preferences: formData.preferences,
      };

      if (editingPet) {
        const response = await axios.put(`/users/pets/${editingPet.id}`, textData);
        savedPetData = response.data.pet; // Guarda os dados atualizados

        if (selectedFile) {
          await uploadPetImage(editingPet.id, selectedFile);
          // Busca novamente os dados do pet para obter a nova URL da imagem
          const updatedPetResponse = await axios.get(`/users/pets/${editingPet.id}`);
          savedPetData = updatedPetResponse.data;
        }
        setMessage('Pet atualizado com sucesso!');

      } else {
        const response = await axios.post('/users/pets', textData);
        savedPetData = response.data.pet; // Guarda os dados do novo pet
        const newPetId = savedPetData.id;

        if (selectedFile) {
          await uploadPetImage(newPetId, selectedFile);
           // Busca novamente os dados do pet para obter a nova URL da imagem
           const updatedPetResponse = await axios.get(`/users/pets/${newPetId}`);
           savedPetData = updatedPetResponse.data;
        }
        setMessage('Pet cadastrado com sucesso!');
      }

      await fetchPets(); // Recarrega a lista
      handleCancel(); // Limpa o formulário

      // --- CORREÇÃO AQUI: Atualiza o preview com a URL do backend após salvar ---
      // Esta linha não é estritamente necessária aqui porque handleCancel já limpa,
      // mas garante que se handleCancel mudar, a lógica de limpar preview permanece.
      setImagePreview(null);
      // --- FIM DA CORREÇÃO ---

    } catch (error) {
       console.error('Erro ao salvar pet:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Erro ao salvar pet');
      // Não reverte o preview aqui, deixa o usuário tentar corrigir
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
      preferences: pet.preferences || ''
    });
    // --- CORREÇÃO AQUI: Usa getImageUrl ---
    setImagePreview(getImageUrl(pet.profile_picture));
    // --- FIM DA CORREÇÃO ---
    setSelectedFile(null);
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const handleDelete = async (petId) => {
    if (!window.confirm('Tem certeza que deseja remover este pet?')) {
      return;
    }
    setError(''); // Limpa erro antes de tentar deletar
    try {
      await axios.delete(`/users/pets/${petId}`);
      setMessage('Pet removido com sucesso!');
      await fetchPets();
    } catch (error) {
       console.error('Erro ao remover pet:', error.response?.data || error.message);
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
      preferences: ''
    });
    setError('');
    setSelectedFile(null);
    setImagePreview(null);
    // Não limpa a mensagem de sucesso aqui, deixa o usuário ver
  };

  return (
    <div className="space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meus Pets</h1>
          <p className="text-gray-600 mt-1">Gerencie as informações dos seus companheiros</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              handleCancel(); // Limpa form antes de abrir para Adicionar
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Pet
          </Button>
        )}
      </div>

      {/* Alertas */}
      {message && !error && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulário Pet Responsivo */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {editingPet ? 'Editar Pet' : 'Adicionar Novo Pet'}
            </CardTitle>
            <CardDescription>
              Preencha as informações do seu pet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Preview da Imagem */}
              {imagePreview && (
                <div className="flex justify-center mb-4"> {/* Adicionado margin-bottom */}
                  <img
                    src={imagePreview}
                    alt="Preview do pet"
                    className="w-24 h-24 rounded-full object-cover border" // Adicionado borda
                  />
                </div>
              )}

              {/* Grid Responsivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do pet" required className="text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="breed">Raça</Label>
                  <Input id="breed" name="breed" value={formData.breed} onChange={handleChange} placeholder="Raça do pet" className="text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Idade em anos" min="0" max="30" className="text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input id="weight" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} placeholder="Peso em kg" min="0" className="text-base" />
                </div>
              </div>

              {/* Input de Upload */}
              <div className="space-y-1.5">
                <Label htmlFor="profile_picture">
                  {editingPet ? 'Alterar Foto' : 'Adicionar Foto'}
                </Label>
                <Input
                  id="profile_picture"
                  name="profile_picture"
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleFileChange}
                  className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                 {/* Dica sobre tamanho/formato */}
                 <p className="text-xs text-muted-foreground">PNG, JPG ou GIF.</p>
              </div>

              {/* Preferências */}
              <div className="space-y-1.5">
                <Label htmlFor="preferences">Preferências e Características</Label>
                <Textarea id="preferences" name="preferences" value={formData.preferences} onChange={handleChange} placeholder="Ex: Tem medo de outros cães..." rows={3} className="text-base" />
              </div>

              {/* Botões Responsivos */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : (editingPet ? 'Atualizar Pet' : 'Cadastrar Pet')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Lista de Pets Responsiva */}
      {!loading && pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center overflow-hidden border"> {/* Borda adicionada */}
                  {/* --- CORREÇÃO AQUI: Usa getImageUrl --- */}
                  {pet.profile_picture ? (
                    <img
                      src={getImageUrl(pet.profile_picture)} // Usa a URL completa
                      alt={pet.name}
                      className="w-full h-full object-cover"
                      key={getImageUrl(pet.profile_picture)} // Key para forçar re-render
                    />
                  ) : (
                    <Heart className="w-10 h-10 text-white" />
                  )}
                  {/* --- FIM DA CORREÇÃO --- */}
                </div>
                <CardTitle className="text-lg font-semibold">{pet.name}</CardTitle>
                {pet.breed && (
                  <CardDescription className="text-sm">{pet.breed}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-grow">
                <div className="grid grid-cols-2 gap-2">
                  {pet.age !== null && pet.age !== undefined && (
                    <div><span className="font-medium">Idade:</span><p className="text-gray-600">{pet.age} {pet.age === 1 ? 'ano' : 'anos'}</p></div>
                  )}
                  {pet.weight !== null && pet.weight !== undefined && (
                    <div><span className="font-medium">Peso:</span><p className="text-gray-600">{pet.weight} kg</p></div>
                  )}
                </div>
                {pet.preferences && (
                  <div className="pt-1"><span className="font-medium">Observações:</span><p className="text-gray-600 mt-0.5 line-clamp-3">{pet.preferences}</p></div>
                )}
              </CardContent>
              <div className="flex space-x-2 p-4 mt-auto border-t">
                <Button variant="outline" size="sm" onClick={() => handleEdit(pet)} className="flex-1">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />Editar
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(pet.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 w-9 h-9 sm:w-auto sm:h-auto">
                  <Trash2 className="w-4 h-4" /><span className="sr-only">Remover</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !loading && !showForm && ( // Mensagem de Nenhum Pet
          <Card>
            <CardContent className="text-center py-12">
              <Dog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pet cadastrado</h3>
              <p className="text-gray-600 mb-6 px-4">Adicione seu primeiro pet para começar a usar o Walkie</p>
              <Button onClick={() => { handleCancel(); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                <Plus className="w-4 h-4 mr-2" />Adicionar Primeiro Pet
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default Pets;