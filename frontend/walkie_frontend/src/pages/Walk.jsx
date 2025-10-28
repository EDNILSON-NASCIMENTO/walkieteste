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
  Heart,
  Loader2 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom'; // Import Link

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to update map center
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
}

const Walk = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [walkState, setWalkState] = useState('idle'); // idle, active, paused
  const [currentWalk, setCurrentWalk] = useState(null);
  const [position, setPosition] = useState(null); // { lat: number, lng: number } | null
  const [route, setRoute] = useState([]); // Array<{ lat: number, lng: number }>
  const [walkStats, setWalkStats] = useState({ duration: 0, distance: 0, calories: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // For API calls
  const [loadingLocation, setLoadingLocation] = useState(false); // For initial location fetch

  const watchId = useRef(null);
  const startTime = useRef(null); 
  const pausedTime = useRef(0); 
  const lastPauseStartTime = useRef(null);
  const intervalId = useRef(null);

  useEffect(() => {
    fetchPets();
    return () => { 
      stopTracking();
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, []);

  useEffect(() => {
    if (walkState === 'active') {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = setInterval(updateStats, 1000);
    } else {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = null;
    }
    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, [walkState]); 

  const fetchPets = async () => {
    setError('');
    setLoading(true);
    try {
      // *** CORREÇÃO AQUI ***
      const response = await axios.get('/api/users/pets');
      // *** FIM DA CORREÇÃO ***
      
      if (Array.isArray(response.data)) {
        setPets(response.data);
      } else {
        setPets([]);
      }
    } catch (err) {
      console.error('Erro ao carregar pets:', err);
      setError(err.message || 'Erro ao carregar pets');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

   const updateStats = () => {
    if (startTime.current && walkState === 'active') {
      const now = Date.now();
      const elapsedMilliseconds = now - startTime.current - pausedTime.current;
      const currentDuration = Math.max(0, Math.floor(elapsedMilliseconds / 1000));

      let currentDistance = 0;
      if (route.length > 1) {
        for (let i = 1; i < route.length; i++) {
          currentDistance += calculateDistance(
            route[i - 1].lat, route[i - 1].lng,
            route[i].lat, route[i].lng
          );
        }
      }

      const currentCalories = Math.floor((currentDistance / 1000) * 50);

      setWalkStats({
        duration: currentDuration,
        distance: Math.round(currentDistance), // meters
        calories: currentCalories
      });
    } else if (walkState === 'paused' && startTime.current && lastPauseStartTime.current) {
        const activeMilliseconds = startTime.current && lastPauseStartTime.current
                                  ? (lastPauseStartTime.current - startTime.current - pausedTime.current)
                                  : 0;
        const pausedDuration = Math.max(0, Math.floor(activeMilliseconds / 1000));
         setWalkStats(prev => ({ ...prev, duration: pausedDuration }));
    }
  };


  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada.');
      return;
    }
    setLoadingLocation(true); 
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const initialPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(initialPosition);
        setRoute([initialPosition]); 
        setLoadingLocation(false);

        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
             if (walkState !== 'active') return; 

            const newPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const lastPosition = route[route.length - 1];

            if (!lastPosition || calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng) > 1) { 
                 setPosition(newPosition);
                 setRoute(prev => [...prev, newPosition]);
            }
          },
          (geoError) => {
            console.error('Erro de geolocalização (watch):', geoError);
            setError(`Erro ao rastrear localização: ${geoError.message}`);
            stopTracking(); 
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 } 
        );
      },
      (geoError) => {
        console.error('Erro ao obter posição inicial:', geoError);
        setError(`Não foi possível obter a localização inicial: ${geoError.message}. Verifique as permissões.`);
        setLoadingLocation(false);
         setWalkState('idle'); 
         setCurrentWalk(null);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 } 
    );
  };


  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

 const startWalk = async () => {
    if (!selectedPet) {
      setError('Selecione um pet para iniciar.');
      return;
    }
    if (loading || loadingLocation) return; 

    setLoading(true); 
    setError('');
    setWalkStats({ duration: 0, distance: 0, calories: 0 }); 
    setRoute([]); 
    setPosition(null); 
    pausedTime.current = 0; 
    lastPauseStartTime.current = null;


    try {
      // *** CORREÇÃO AQUI ***
      const response = await axios.post('/api/walks/start', { pet_id: parseInt(selectedPet) });
      // *** FIM DA CORREÇÃO ***
      
      setCurrentWalk(response.data.walk);
      setWalkState('active');
      startTime.current = Date.now(); 
      startTracking(); 

    } catch (err) {
      console.error("Error starting walk:", err);
      setError(err.response?.data?.error || err.message || 'Erro ao iniciar passeio');
      setWalkState('idle'); 
      setCurrentWalk(null);
    } finally {
      setLoading(false); 
    }
  };

  const pauseWalk = () => {
     if (walkState !== 'active') return;
    lastPauseStartTime.current = Date.now(); 
    setWalkState('paused');
    stopTracking(); 
    updateStats(); 
  };

  const resumeWalk = () => {
     if (walkState !== 'paused' || !lastPauseStartTime.current) return;
    pausedTime.current += Date.now() - lastPauseStartTime.current;
    lastPauseStartTime.current = null; 
    setWalkState('active');
    startTracking(); 
  };


   const finishWalk = async () => {
    if (!currentWalk || loading) return;

    setLoading(true);
    stopTracking(); 
    if (intervalId.current) clearInterval(intervalId.current); 
    intervalId.current = null;

    updateStats();

    const finalStats = { ...walkStats };
    const finalRoute = [...route];

    try {
      const payload = {
          route_data: finalRoute,
          distance: finalStats.distance, // meters
          duration: finalStats.duration, // seconds
          calories: finalStats.calories,
      };

      // *** CORREÇÃO AQUI ***
      await axios.put(`/api/walks/finish/${currentWalk.id}`, payload);
      // *** FIM DA CORREÇÃO ***

      setWalkState('idle');
      setCurrentWalk(null);
      setRoute([]);
      setPosition(null);
      setWalkStats({ duration: 0, distance: 0, calories: 0 });
      startTime.current = null;
      pausedTime.current = 0;
      lastPauseStartTime.current = null;
      setSelectedPet(''); 

      alert('Passeio finalizado com sucesso!');

    } catch (err) {
      console.error("Error finishing walk:", err);
      setError(err.response?.data?.error || err.message || 'Erro ao finalizar passeio');
      setLoading(false);
    }
  };


  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num) => num.toString().padStart(2, '0');

    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    return `${pad(minutes)}:${pad(secs)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Passeio</h1>
          <p className="text-gray-600 mt-1">Monitore seu passeio em tempo real</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden"> 
            <CardHeader className="pb-2"> 
              <CardTitle className="flex items-center text-xl">
                <MapPin className="w-5 h-5 mr-2" />
                Mapa do Passeio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                 {loadingLocation && (
                   <div className="text-center text-gray-600">
                     <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
                     Obtendo localização inicial...
                   </div>
                 )}
                {!loadingLocation && position ? (
                  <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={16}
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%' }}
                  >
                     <ChangeMapView coords={[position.lat, position.lng]} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[position.lat, position.lng]} />
                    {route.length > 1 && (
                      <Polyline
                        positions={route.map(p => [p.lat, p.lng])}
                        color="#3b82f6" 
                        weight={5}
                        opacity={0.8}
                      />
                    )}
                  </MapContainer>
                ) : (
                  !loadingLocation && (
                    <div className="text-center text-gray-500 px-4">
                      <MapPin className="w-12 h-12 mx-auto mb-3" />
                      <p>Aguardando início do passeio ou localização...</p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Stats Area */}
        <div className="space-y-4 md:space-y-6">

          {/* Pet Selection (Only if Idle) */}
          {walkState === 'idle' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Heart className="w-5 h-5 mr-2" />
                  Selecionar Pet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPet} onValueChange={setSelectedPet} disabled={loading || pets.length === 0}>
                  <SelectTrigger className="w-full text-base">
                    <SelectValue placeholder={pets.length > 0 ? "Escolha seu pet" : "Nenhum pet cadastrado"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id.toString()} className="text-base">
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {pets.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                        Você precisa <Link to="/pets" className="text-blue-600 hover:underline">cadastrar um pet</Link> antes de passear.
                    </p>
                 )}
              </CardContent>
            </Card>
          )}

          {/* Walk Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Controles do Passeio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {walkState === 'idle' && (
                <Button
                  onClick={startWalk}
                  disabled={loading || loadingLocation || !selectedPet || pets.length === 0}
                  className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {loading || loadingLocation ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {loading ? 'Iniciando...' : (loadingLocation ? 'Obtendo Local...' : 'Iniciar Passeio')}
                </Button>
              )}

              {walkState === 'active' && (
                <div className="space-y-3">
                  <Button onClick={pauseWalk} variant="outline" className="w-full text-lg py-3">
                    <Pause className="w-5 h-5 mr-2" /> Pausar
                  </Button>
                  <Button onClick={finishWalk} disabled={loading} variant="destructive" className="w-full text-lg py-3">
                     {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Square className="w-5 h-5 mr-2" />}
                    {loading ? 'Finalizando...' : 'Finalizar'}
                  </Button>
                </div>
              )}

              {walkState === 'paused' && (
                <div className="space-y-3">
                  <Button onClick={resumeWalk} className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    <Play className="w-5 h-5 mr-2" /> Retomar
                  </Button>
                   <Button onClick={finishWalk} disabled={loading} variant="destructive" className="w-full text-lg py-3">
                     {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Square className="w-5 h-5 mr-2" />}
                    {loading ? 'Finalizando...' : 'Finalizar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Walk Stats (Show always if not idle, or with placeholders if idle) */}
          {(walkState !== 'idle' || !loading) && ( // Show placeholders when idle and not loading
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Estatísticas Atuais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center"> {/* Use 3 columns */}
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-blue-600">
                     {walkState === 'idle' ? '--:--' : formatTime(walkStats.duration)}
                  </div>
                  <p className="text-xs text-gray-600">Duração</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Route className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-green-600">
                     {walkState === 'idle' ? '0.00' : (walkStats.distance / 1000).toFixed(2)} km
                  </div>
                  <p className="text-xs text-gray-600">Distância</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-orange-600">
                     {walkState === 'idle' ? '0' : walkStats.calories}
                  </div>
                  <p className="text-xs text-gray-600">Calorias</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Button (Only if active or paused) */}
          {walkState !== 'idle' && (
            <Card>
              <CardContent className="pt-6">
                <Button variant="destructive" className="w-full text-lg py-3" onClick={() => alert('Função de emergência - Em desenvolvimento')}>
                  <AlertTriangle className="w-5 h-5 mr-2" /> Emergência
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