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
import { Link } from 'react-router-dom';

// Fix icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map view component
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => { if (coords) map.setView(coords, map.getZoom()); }, [coords, map]);
  return null;
}

// Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Walk = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [walkState, setWalkState] = useState('idle');
  const [currentWalk, setCurrentWalk] = useState(null);
  const [position, setPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [walkStats, setWalkStats] = useState({ duration: 0, distance: 0, calories: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const watchId = useRef(null);
  const startTime = useRef(null);
  const pausedTime = useRef(0);
  const lastPauseStartTime = useRef(null);
  const intervalId = useRef(null);
  const totalDistance = useRef(0); // Ref para acumular distância

  useEffect(() => {
    fetchPets();
    return () => { stopTracking(); if (intervalId.current) clearInterval(intervalId.current); };
  }, []);

  useEffect(() => {
    if (walkState === 'active') {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = setInterval(updateTimerAndCalories, 1000); // Atualiza timer/calorias
    } else {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = null;
    }
    return () => { if (intervalId.current) clearInterval(intervalId.current); };
  }, [walkState]);

  const fetchPets = async () => {
    setError('');
    // setLoading(true); // Removido daqui, já é true inicialmente
    try {
      const response = await axios.get('/users/pets'); // URL correta
      if (Array.isArray(response.data)) { setPets(response.data); }
      else { console.warn('API /users/pets did not return array:', response.data); setPets([]); }
    } catch (err) { console.error('Erro ao carregar pets:', err.response?.data || err.message); setError(err.response?.data?.error || 'Erro ao carregar pets'); setPets([]); }
    finally { setLoading(false); }
  };

  // Atualiza apenas timer e calorias via Interval
  const updateTimerAndCalories = () => {
    let currentDuration = 0;
    if (startTime.current && walkState === 'active') {
        const now = Date.now();
        const elapsedMilliseconds = now - startTime.current - pausedTime.current;
        currentDuration = Math.max(0, Math.floor(elapsedMilliseconds / 1000));
    } else if (walkState === 'paused' && startTime.current && lastPauseStartTime.current) {
        const activeMilliseconds = lastPauseStartTime.current - startTime.current - pausedTime.current;
        currentDuration = Math.max(0, Math.floor(activeMilliseconds / 1000));
    }
    const currentCalories = Math.floor((totalDistance.current / 1000) * 50); // Usa ref

    setWalkStats(prev => ({ ...prev, duration: currentDuration, calories: currentCalories }));
    // console.log("Timer Tick - Duration:", currentDuration, "Dist (ref):", totalDistance.current);
  };

  // Atualiza posição, rota e distância via watchPosition
  const handlePositionUpdate = (pos) => {
    if (walkState !== 'active') return;

    const newPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setPosition(newPosition); // Para o marcador

    const lastPosition = route.length > 0 ? route[route.length - 1] : null;

    if (lastPosition) {
        const distanceIncrement = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        if (distanceIncrement > 1) { // Só atualiza se mover > 1m
            totalDistance.current += distanceIncrement; // Acumula na Ref
            setRoute(prev => [...prev, newPosition]); // Atualiza rota visual
            setWalkStats(prev => ({ ...prev, distance: Math.round(totalDistance.current) })); // Atualiza distância visual
            // console.log("Pos Update - Inc:", distanceIncrement.toFixed(1), "Total:", totalDistance.current.toFixed(1));
        }
    } else {
        // Primeiro ponto
        setRoute([newPosition]);
        // console.log("Pos Update - First Point");
    }
  };

  const handlePositionError = (geoError) => {
    console.error('Erro de geolocalização (watch):', geoError);
    setError(`Erro GPS: ${geoError.message}. Verifique permissões/sinal.`);
  };

  const startTracking = () => {
    if (!navigator.geolocation) { setError('Geolocalização não suportada.'); return; }
    setLoadingLocation(true); setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionUpdate(pos); // Processa primeiro ponto
        setLoadingLocation(false);
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = navigator.geolocation.watchPosition(
          handlePositionUpdate, handlePositionError,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      (geoError) => { console.error('Erro GPS inicial:', geoError); setError(`Erro GPS inicial: ${geoError.message}. Verifique permissões.`); setLoadingLocation(false); setWalkState('idle'); setCurrentWalk(null); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  const stopTracking = () => {
     if (watchId.current) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; /*console.log("Tracking stopped.");*/ }
  };

  const startWalk = async () => {
    if (!selectedPet) { setError('Selecione um pet para iniciar.'); return; }
    if (loading || loadingLocation) return;
    setLoading(true); setError('');
    setWalkStats({ duration: 0, distance: 0, calories: 0 }); setRoute([]); setPosition(null);
    totalDistance.current = 0; pausedTime.current = 0; lastPauseStartTime.current = null; // Reseta refs

    try {
      const response = await axios.post('/walks/start', { pet_id: parseInt(selectedPet) }); // URL Correta
      setCurrentWalk(response.data.walk); setWalkState('active'); startTime.current = Date.now(); startTracking();
      // console.log("Walk started:", response.data.walk);
    } catch (err) { console.error("Error starting walk:", err.response?.data || err.message); setError(err.response?.data?.error || 'Erro ao iniciar passeio'); setWalkState('idle'); setCurrentWalk(null); }
    finally { setLoading(false); }
  };

  const pauseWalk = () => {
     if (walkState !== 'active') return;
     lastPauseStartTime.current = Date.now(); setWalkState('paused'); stopTracking(); updateTimerAndCalories();
     // console.log("Walk paused");
  };

  const resumeWalk = () => {
     if (walkState !== 'paused' || !lastPauseStartTime.current) return;
     pausedTime.current += Date.now() - lastPauseStartTime.current; lastPauseStartTime.current = null; setWalkState('active'); startTracking();
     // console.log("Walk resumed");
  };

  const finishWalk = async () => {
    if (!currentWalk || loading) return;
    // console.log("Attempting finish:", currentWalk.id);
    setLoading(true); stopTracking(); if (intervalId.current) clearInterval(intervalId.current); intervalId.current = null;

    // Garante que timer/calorias estejam atualizados antes do timeout
    updateTimerAndCalories();

    // Pequeno delay para garantir que o estado walkStats reflita a última atualização
    setTimeout(async () => {
        let finalStatsToSend;
        let finalRouteToSend;

        // Captura o estado MAIS ATUALIZADO dentro do timeout
        setWalkStats(currentStats => {
            finalStatsToSend = { ...currentStats }; // Copia o estado atual
             // Certifica que a distância da ref é usada se for mais recente
            finalStatsToSend.distance = Math.round(totalDistance.current);
            return currentStats; // Não muda o estado aqui
        });
        setRoute(currentRoute => {
            finalRouteToSend = [...currentRoute]; // Copia a rota atual
            return currentRoute; // Não muda o estado aqui
        })


        try {
            const payload = {
                route_data: finalRouteToSend.map(p => ({ lat: p.lat, lng: p.lng })),
                distance: finalStatsToSend.distance, // Distância em METROS
                duration: finalStatsToSend.duration, // Duração em SEGUNDOS
                calories: finalStatsToSend.calories,
            };

            // console.log("Final payload:", payload);

            await axios.put(`/walks/finish/${currentWalk.id}`, payload); // URL Correta
            // console.log("Walk finished backend OK.");

            // Reset state após sucesso
            setWalkState('idle'); setCurrentWalk(null); setRoute([]); setPosition(null);
            setWalkStats({ duration: 0, distance: 0, calories: 0 }); totalDistance.current = 0;
            startTime.current = null; pausedTime.current = 0; lastPauseStartTime.current = null; setSelectedPet('');

            alert('Passeio finalizado com sucesso!');
            // setLoading(false) // Não precisa, pois o estado é resetado

        } catch (err) {
            console.error("Error finishing walk:", err.response?.data || err.message);
            setError(err.response?.data?.error || 'Erro ao finalizar passeio. Verifique o console.');
            setLoading(false); // Libera o botão no erro
        }
    }, 150); // Aumentado ligeiramente o delay para segurança
   };


  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const secs = seconds % 60; const pad = (num) => num.toString().padStart(2, '0');
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`; return `${pad(minutes)}:${pad(secs)}`;
  };

  return (
    // Container principal com espaçamento
    <div className="space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div> <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Passeio</h1> <p className="text-gray-600 mt-1">Monitore seu passeio em tempo real</p> </div>
      </div>

      {/* Alerta de Erro */}
      {error && ( <Alert variant="destructive"> <AlertTriangle className="h-4 w-4" /> <AlertDescription>{error}</AlertDescription> </Alert> )}

      {/* Grid Responsivo (Mapa | Controles/Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna do Mapa (ocupa mais espaço em telas grandes) */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2"> <CardTitle className="flex items-center text-xl"> <MapPin className="w-5 h-5 mr-2" /> Mapa do Passeio </CardTitle> </CardHeader>
            <CardContent>
              {/* Container do Mapa com altura responsiva */}
              <div className="h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-md overflow-hidden bg-gray-200 flex items-center justify-center relative">
                 {/* Overlay de Loading GPS */}
                 {(loadingLocation || (walkState === 'active' && !position)) && (
                    <div className="absolute inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-10">
                        <div className="text-center text-gray-600 p-4 rounded bg-white shadow"> <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" /> {loadingLocation ? 'Obtendo localização...' : 'Aguardando GPS...'} </div>
                    </div>
                 )}
                 {/* Placeholder Inicial */}
                 {!position && !loadingLocation && walkState === 'idle' && ( <div className="text-center text-gray-500 px-4"> <MapPin className="w-12 h-12 mx-auto mb-3" /> <p>Pronto para iniciar.</p> </div> )}
                 {/* Mapa Leaflet */}
                 {(position || walkState !== 'idle') && (
                  <MapContainer center={position ? [position.lat, position.lng] : [-23.65, -46.53]} zoom={position ? 16 : 13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                     {position && <ChangeMapView coords={[position.lat, position.lng]} />}
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    {position && <Marker position={[position.lat, position.lng]} />}
                    {route.length > 1 && (<Polyline positions={route.map(p => [p.lat, p.lng])} color="#3b82f6" weight={5} opacity={0.8} />)}
                  </MapContainer>
                 )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna de Controles e Stats */}
        <div className="space-y-4 md:space-y-6">

          {/* Seleção de Pet */}
          {walkState === 'idle' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg"> <Heart className="w-5 h-5 mr-2" /> Selecionar Pet </CardTitle>
                {!loading && pets.length > 0 && (<CardDescription>Escolha um pet para iniciar.</CardDescription>)}
              </CardHeader>
              <CardContent>
                 {loading ? (<div className="flex items-center justify-center h-10"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>)
                 : pets.length > 0 ? (
                    <Select value={selectedPet} onValueChange={setSelectedPet} >
                      <SelectTrigger className="w-full text-base"><SelectValue placeholder="Escolha seu pet" /></SelectTrigger>
                      <SelectContent>{pets.map((pet) => (<SelectItem key={pet.id} value={pet.id.toString()} className="text-base">{pet.name}</SelectItem>))}</SelectContent>
                    </Select>
                 ) : (<p className="text-sm text-muted-foreground text-center">Precisa <Link to="/pets" className="text-blue-600 hover:underline">cadastrar um pet</Link>.</p>)}
              </CardContent>
            </Card>
          )}

          {/* Controles do Passeio */}
          <Card>
            <CardHeader className="pb-3"> <CardTitle className="text-lg">Controles</CardTitle> </CardHeader>
            <CardContent className="space-y-3">
              {/* Botão Iniciar (Idle) */}
              {walkState === 'idle' && (
                <Button onClick={startWalk} disabled={loading || loadingLocation || !selectedPet || pets.length === 0} className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  {loading || loadingLocation ? (<Loader2 className="w-5 h-5 mr-2 animate-spin" />) : (<Play className="w-5 h-5 mr-2" />)}
                  {loading ? 'Aguarde...' : (loadingLocation ? 'GPS...' : 'Iniciar Passeio')}
                </Button>
              )}
              {/* Botões Pausar/Finalizar (Active) */}
              {walkState === 'active' && (
                <div className="space-y-3">
                  <Button onClick={pauseWalk} variant="outline" className="w-full text-lg py-3"><Pause className="w-5 h-5 mr-2" /> Pausar</Button>
                  <Button onClick={finishWalk} disabled={loading} variant="destructive" className="w-full text-lg py-3"> {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Square className="w-5 h-5 mr-2" />} {loading ? 'Finalizando...' : 'Finalizar'} </Button>
                </div>
              )}
              {/* Botões Retomar/Finalizar (Paused) */}
              {walkState === 'paused' && (
                <div className="space-y-3">
                  <Button onClick={resumeWalk} className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"><Play className="w-5 h-5 mr-2" /> Retomar</Button>
                  <Button onClick={finishWalk} disabled={loading} variant="destructive" className="w-full text-lg py-3"> {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Square className="w-5 h-5 mr-2" />} {loading ? 'Finalizando...' : 'Finalizar'} </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {(walkState !== 'idle' || !loading) && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Estatísticas</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-blue-50 rounded-lg"><Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" /><div className="text-xl font-bold text-blue-600">{formatTime(walkStats.duration)}</div><p className="text-xs text-gray-600">Duração</p></div>
                <div className="p-2 bg-green-50 rounded-lg"><Route className="w-6 h-6 text-green-500 mx-auto mb-1" /><div className="text-xl font-bold text-green-600">{(walkStats.distance / 1000).toFixed(2)} km</div><p className="text-xs text-gray-600">Distância</p></div>
                <div className="p-2 bg-orange-50 rounded-lg"><Zap className="w-6 h-6 text-orange-500 mx-auto mb-1" /><div className="text-xl font-bold text-orange-600">{walkStats.calories}</div><p className="text-xs text-gray-600">Calorias</p></div>
              </CardContent>
            </Card>
          )}

          {/* Emergência */}
          {walkState !== 'idle' && (
            <Card><CardContent className="pt-6"><Button variant="destructive" className="w-full text-lg py-3" onClick={() => alert('SOS Ativado (Em desenvolvimento)')}><AlertTriangle className="w-5 h-5 mr-2" /> Emergência</Button></CardContent></Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default Walk;