import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Route,
  Zap,
  AlertTriangle,
  Heart
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Walk = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [walkState, setWalkState] = useState('idle'); // idle, active, paused
  const [currentWalk, setCurrentWalk] = useState(null);
  const [position, setPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [walkStats, setWalkStats] = useState({
    duration: 0,
    distance: 0,
    calories: 0
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const watchId = useRef(null);
  const startTime = useRef(null);
  const intervalId = useRef(null);

  useEffect(() => {
    fetchPets();
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, []);

  const fetchPets = async () => {
    try {
      const response = await axios.get('/users/pets');
      setPets(response.data);
    } catch (error) {
      console.error('Erro ao carregar pets:', error);
      setError('Erro ao carregar pets');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateStats = () => {
    if (startTime.current && walkState === 'active') {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      
      let distance = 0;
      if (route.length > 1) {
        for (let i = 1; i < route.length; i++) {
          distance += calculateDistance(
            route[i-1].lat, route[i-1].lng,
            route[i].lat, route[i].lng
          );
        }
      }

      const calories = Math.floor(distance * 0.05); // Aproximação simples

      setWalkStats({
        duration,
        distance: Math.round(distance),
        calories
      });
    }
  };

  const startWalk = async () => {
    if (!selectedPet) {
      setError('Selecione um pet para iniciar o passeio');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/walks/start', {
        pet_id: parseInt(selectedPet)
      });

      setCurrentWalk(response.data.walk);
      setWalkState('active');
      startTime.current = Date.now();
      setRoute([]);

      // Iniciar rastreamento de localização
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          
          setPosition(newPosition);
          setRoute(prev => [...prev, newPosition]);
        },
        (error) => {
          console.error('Erro de geolocalização:', error);
          setError('Erro ao obter localização');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );

      // Iniciar timer para atualizar estatísticas
      intervalId.current = setInterval(updateStats, 1000);

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao iniciar passeio');
    } finally {
      setLoading(false);
    }
  };

  const pauseWalk = () => {
    setWalkState('paused');
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  const resumeWalk = () => {
    setWalkState('active');
    
    // Retomar rastreamento
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        
        setPosition(newPosition);
        setRoute(prev => [...prev, newPosition]);
      },
      (error) => {
        console.error('Erro de geolocalização:', error);
        setError('Erro ao obter localização');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );

    // Retomar timer
    intervalId.current = setInterval(updateStats, 1000);
  };

  const finishWalk = async () => {
    if (!currentWalk) return;

    setLoading(true);

    try {
      await axios.put(`/walks/finish/${currentWalk.id}`, {
        route_data: route
      });

      // Limpar estado
      setWalkState('idle');
      setCurrentWalk(null);
      setRoute([]);
      setPosition(null);
      setWalkStats({ duration: 0, distance: 0, calories: 0 });
      
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }

      alert('Passeio finalizado com sucesso!');

    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao finalizar passeio');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Passeio</h1>
          <p className="text-gray-600">Monitore seu passeio em tempo real</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Mapa do Passeio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden">
                {position ? (
                  <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {position && (
                      <Marker position={[position.lat, position.lng]} />
                    )}
                    {route.length > 1 && (
                      <Polyline
                        positions={route.map(point => [point.lat, point.lng])}
                        color="blue"
                        weight={4}
                      />
                    )}
                  </MapContainer>
                ) : (
                  <div className="h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Inicie um passeio para ver o mapa</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Stats */}
        <div className="space-y-6">
          {/* Pet Selection */}
          {walkState === 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Selecionar Pet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPet} onValueChange={setSelectedPet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha seu pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id.toString()}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Walk Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {walkState === 'idle' && (
                <Button
                  onClick={startWalk}
                  disabled={loading || !selectedPet}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? 'Iniciando...' : 'Iniciar Passeio'}
                </Button>
              )}

              {walkState === 'active' && (
                <div className="space-y-2">
                  <Button
                    onClick={pauseWalk}
                    variant="outline"
                    className="w-full"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                  <Button
                    onClick={finishWalk}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {loading ? 'Finalizando...' : 'Finalizar'}
                  </Button>
                </div>
              )}

              {walkState === 'paused' && (
                <div className="space-y-2">
                  <Button
                    onClick={resumeWalk}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Retomar
                  </Button>
                  <Button
                    onClick={finishWalk}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {loading ? 'Finalizando...' : 'Finalizar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Walk Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(walkStats.duration)}
                </div>
                <p className="text-sm text-gray-600">Duração</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Route className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {(walkStats.distance / 1000).toFixed(2)} km
                </div>
                <p className="text-sm text-gray-600">Distância</p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {walkStats.calories}
                </div>
                <p className="text-sm text-gray-600">Calorias</p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Button */}
          {walkState !== 'idle' && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => alert('Função de emergência - Em desenvolvimento')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergência
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Walk;

