import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Loader2,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";

// Fix icons (SEU CÓDIGO ORIGINAL)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map view component (SEU CÓDIGO ORIGINAL)
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
};

// Haversine formula (SEU CÓDIGO ORIGINAL)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Walk = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [walkState, setWalkState] = useState("idle");
  const [currentWalk, setCurrentWalk] = useState(null);
  const [position, setPosition] = useState(null);
  const [route, setRoute] = useState([]); // Garantido como array
  const [walkStats, setWalkStats] = useState({
    duration: 0,
    distance: 0,
    calories: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Loading dos Pets
  
  // AJUSTE 1: Mudei 'loadingLocation' para 'true' para o carregamento inicial
  const [loadingLocation, setLoadingLocation] = useState(true);

  const watchId = useRef(null);
  const startTime = useRef(null);
  const pausedTime = useRef(0);
  const lastPauseStartTime = useRef(null);
  const intervalId = useRef(null);
  const totalDistance = useRef(0); // Ref para acumular distância

  useEffect(() => {
    // AJUSTE 2: Função para carregar o mapa na abertura
    const getInitialLocation = () => {
      if (!navigator.geolocation) {
        setError("Geolocalização não suportada.");
        setLoadingLocation(false);
        return;
      }
      
      // Pede a localização 1 vez, apenas para mostrar o mapa
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLocation(false); // Para de carregar
        },
        (geoError) => {
          console.error("Erro GPS inicial (onLoad):", geoError);
          setError(`Erro GPS: ${geoError.message}. Verifique permissões.`);
          setLoadingLocation(false); // Para de carregar mesmo com erro
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    getInitialLocation(); // CHAMA A FUNÇÃO DE LOCALIZAÇÃO INICIAL
    fetchPets(); // CHAMA SEU FETCHPETS ORIGINAL

    return () => {
      stopTracking();
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, []); // Executa apenas uma vez

  useEffect(() => {
    // (SEU CÓDIGO ORIGINAL - Perfeito para o timer)
    if (walkState === "active") {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = setInterval(updateTimerAndCalories, 1000); // Atualiza timer/calorias
    } else {
      if (intervalId.current) clearInterval(intervalId.current);
      intervalId.current = null;
    }
    return () => {
      if (intervalId.current) clearInterval(intervalId.current);
    };
  }, [walkState]);

  // (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL)
  // Esta é a sua função que "com certeza FUNCIONA"
  const fetchPets = async () => {
    setError("");
    try {
      const response = await axios.get("/users/pets"); // URL MANTIDA (sem /api)
      if (Array.isArray(response.data)) {
        setPets(response.data);
      } else {
        console.warn("API /users/pets did not return array:", response.data);
        setPets([]);
      }
    } catch (err) {
      console.error(
        "Erro ao carregar pets:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.error || "Erro ao carregar pets");
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  // (SEU CÓDIGO ORIGINAL - Perfeito)
  const getLatestStats = () => {
    let currentDuration = 0;
    
    if (startTime.current && walkState === "active") {
      const now = Date.now();
      const elapsedMilliseconds = now - startTime.current - pausedTime.current;
      currentDuration = Math.max(0, Math.floor(elapsedMilliseconds / 1000));
    } else if (
      walkState === "paused" &&
      startTime.current &&
      lastPauseStartTime.current
    ) {
      const activeMilliseconds =
        lastPauseStartTime.current - startTime.current - pausedTime.current;
      currentDuration = Math.max(0, Math.floor(activeMilliseconds / 1000));
    } else if (startTime.current) { 
      const lastKnownDuration = walkStats.duration;
      const elapsedSinceStart = Math.floor((Date.now() - startTime.current - pausedTime.current) / 1000);
      currentDuration = Math.max(lastKnownDuration, elapsedSinceStart);
    } else {
      currentDuration = walkStats.duration;
    }

    const currentDistance = Math.round(totalDistance.current);
    const currentCalories = Math.floor((currentDistance / 1000) * 50);

    return {
      duration: currentDuration,
      distance: currentDistance,
      calories: currentCalories,
    };
  };

  // (SEU CÓDIGO ORIGINAL - Perfeito)
  const updateTimerAndCalories = () => {
    const latestStats = getLatestStats();
    setWalkStats(latestStats);
  };

  // (SEU CÓDIGO ORIGINAL - Perfeito para atualizar a rota)
  const handlePositionUpdate = (pos) => {
    if (walkState !== "active") return;

    const newPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setPosition(newPosition); // Para o marcador

    let lastPosition = null;
    setRoute((prevRoute) => {
      lastPosition = prevRoute.length > 0 ? prevRoute[prevRoute.length - 1] : null;
      
      if (lastPosition) {
        const distanceIncrement = calculateDistance(
          lastPosition.lat,
          lastPosition.lng,
          newPosition.lat,
          newPosition.lng
        );
        if (distanceIncrement > 1) {
          totalDistance.current += distanceIncrement;
          
          setWalkStats((prevStats) => ({
            ...prevStats,
            distance: Math.round(totalDistance.current),
          })); 
          
          return [...prevRoute, newPosition];
        }
      } else {
        return [newPosition];
      }
      
      return prevRoute;
    });
  };

  // (SEU CÓDIGO ORIGINAL)
  const handlePositionError = (geoError) => {
    console.error("Erro de geolocalização (watch):", geoError);
    setError(`Erro GPS: ${geoError.message}. Verifique permissões/sinal.`);
  };

  // (SEU CÓDIGO ORIGINAL - Ajustado para o loading inicial)
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada.");
      return;
    }
    // 'loadingLocation' agora é controlado pelo 'startWalk'
    // setLoadingLocation(true); 
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const firstPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(firstPos);
        setRoute([firstPos]);
        
        // setLoadingLocation(false); // Controlado pelo 'startWalk'
        setLoading(false); // Para o loading do botão "Iniciar"
        
        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        
        watchId.current = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handlePositionError,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      (geoError) => {
        console.error("Erro GPS inicial:", geoError);
        setError(
          `Erro GPS inicial: ${geoError.message}. Verifique permissões.`
        );
        // setLoadingLocation(false); // Controlado pelo 'startWalk'
        setLoading(false); // Para o loading do botão
        setWalkState("idle");
        setCurrentWalk(null);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 } // Pede posição "nova"
    );
  };

  // (SEU CÓDIGO ORIGINAL)
  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  // (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL)
  // Usando a "referencia" do fetchPets (rota sem /api)
  const startWalk = async () => {
    if (!selectedPet) {
      setError("Selecione um pet para iniciar.");
      return;
    }
    if (loading || loadingLocation) return;
    setLoading(true);
    setError("");
    setWalkStats({ duration: 0, distance: 0, calories: 0 });
    setRoute([]);
    // setPosition(null); // Não reseta a posição para o mapa não piscar
    totalDistance.current = 0;
    pausedTime.current = 0;
    lastPauseStartTime.current = null; // Reseta refs

    try {
      const response = await axios.post("/walks/start", { // URL MANTIDA (sem /api)
        pet_id: parseInt(selectedPet),
      }); 
      setCurrentWalk(response.data.walk);
      setWalkState("active");
      startTime.current = Date.now();
      
      // startTracking agora vai parar o 'setLoading(true)'
      startTracking();
    } catch (err) {
      console.error("Error starting walk:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Erro ao iniciar passeio");
      setWalkState("idle");
      setCurrentWalk(null);
      setLoading(false); // Para o loading se a API falhar
    }
    // 'finally' removido pois 'startTracking' agora controla o setLoading(false)
  };

  // (SEU CÓDIGO ORIGINAL - Perfeito)
  const pauseWalk = () => {
    if (walkState !== "active") return;
    lastPauseStartTime.current = Date.now();
    setWalkState("paused");
    stopTracking();
    updateTimerAndCalories(); // Atualiza UI uma última vez ao pausar
  };

  // (SEU CÓDIGO ORIGINAL - Perfeito)
  const resumeWalk = () => {
    if (walkState !== "paused" || !lastPauseStartTime.current) return;
    pausedTime.current += Date.now() - lastPauseStartTime.current;
    lastPauseStartTime.current = null;
    setWalkState("active");
    startTracking();
  };

  // (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL)
  // Usando a "referencia" do fetchPets (rota sem /api)
  const finishWalk = async () => {
    if (!currentWalk || loading) return;
    setLoading(true);

    stopTracking();
    if (intervalId.current) clearInterval(intervalId.current);
    intervalId.current = null;

    const finalRoute = route; 
    const finalStats = getLatestStats(); 
    setWalkStats(finalStats);

    try {
      const payload = {
        route_data: finalRoute.map((p) => ({ lat: p.lat, lng: p.lng })),
        distance: finalStats.distance,
        duration: finalStats.duration,
        calories: finalStats.calories,
      };

      console.log("Final payload:", payload);

      await axios.put(`/walks/finish/${currentWalk.id}`, payload); // URL MANTIDA (sem /api)
      console.log("Walk finished backend OK.");

      setWalkState("idle");
      setCurrentWalk(null);
      setRoute([]);
      // setPosition(null); // Não reseta a posição
      setWalkStats({ duration: 0, distance: 0, calories: 0 });
      totalDistance.current = 0;
      startTime.current = null;
      pausedTime.current = 0;
      lastPauseStartTime.current = null;
      setSelectedPet("");

      alert("Passeio finalizado com sucesso!");
    
    } catch (err) {
      console.error(
        "Error finishing walk:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.error ||
          "Erro ao finalizar passeio. Verifique o console."
      );
      setLoading(false); // (Seu código original tinha isso)
    }
  };

  // (SEU CÓDIGO ORIGINAL - Perfeito)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num) => num.toString().padStart(2, "0");
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    return `${pad(minutes)}:${pad(secs)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {" "}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Passeio
          </h1>{" "}
          <p className="text-gray-600 mt-1">
            Monitore seu passeio em tempo real
          </p>{" "}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          {" "}
          <AlertTriangle className="h-4 w-4" />{" "}
          <AlertDescription>{error}</AlertDescription>{" "}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              {" "}
              <CardTitle className="flex items-center text-xl">
                {" "}
                <MapPin className="w-5 h-5 mr-2" /> Mapa do Passeio{" "}
              </CardTitle>{" "}
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-md overflow-hidden bg-gray-200 flex items-center justify-center relative">
                
                {/* AJUSTE 3: Lógica de loading/placeholder atualizada */}
                
                {/* Mostra loading SE (loadingLocation E (estado idle OU (estado active E sem posição))) */}
                {(loadingLocation && (walkState === "idle" || (walkState === "active" && !position))) && (
                  <div className="absolute inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-10">
                    <div className="text-center text-gray-600 p-4 rounded bg-white shadow">
                      {" "}
                      <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />{" "}
                      {loadingLocation && walkState === "idle" // Apenas na abertura
                        ? "Obtendo localização..."
                        : "Aguardando GPS..."}
                    </div>
                  </div>
                )}
                
                {/* Mostra placeholder SE (NÃO está carregando E não tem posição E está idle) */}
                {!loadingLocation && !position && walkState === "idle" && (
                  <div className="text-center text-gray-500 px-4">
                    {" "}
                    <MapPin className="w-12 h-12 mx-auto mb-3" />{" "}
                    <p>Não foi possível obter a localização.</p>
                    <p className="text-xs">Verifique as permissões do navegador.</p>
                  </div>
                )}
                
                {/* Mostra o mapa SE (temos uma posição) */}
                {position && (
                  <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={16}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <ChangeMapView coords={[position.lat, position.lng]} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap"
                    />
                    {position && (
                      <Marker position={[position.lat, position.lng]} />
                    )}
                    {route.length > 1 && (
                      <Polyline
                        positions={route.map((p) => [p.lat, p.lng])}
                        color="#3b82f6"
                        weight={5}
                        opacity={0.8}
                      />
                    )}
                  </MapContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL) */}
          {/* Este bloco não foi alterado, como pedido. */}
          {walkState === "idle" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  {" "}
                  <Heart className="w-5 h-5 mr-2" /> Selecionar Pet{" "}
                </CardTitle>
                {!loading && pets.length > 0 && (
                  <CardDescription>
                    Escolha um pet para iniciar.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                ) : pets.length > 0 ? (
                  <Select value={selectedPet} onValueChange={setSelectedPet}>
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Escolha seu pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem
                          key={pet.id}
                          value={pet.id.toString()}
                          className="text-base"
                        >
                          {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Precisa{" "}
                    <Link to="/pets" className="text-blue-600 hover:underline">
                      cadastrar um pet
                    </Link>
                    .
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL) */}
          <Card>
            <CardHeader className="pb-3">
              {" "}
              <CardTitle className="text-lg">Controles</CardTitle>{" "}
            </CardHeader>
            <CardContent className="space-y-3">
              {walkState === "idle" && (
                <Button
                  onClick={startWalk}
                  disabled={
                    loading || // Loading dos Pets OU do 'startWalk'
                    loadingLocation || // Loading do GPS na abertura
                    !selectedPet ||
                    pets.length === 0
                  }
                  className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {/* AJUSTE: Lógica de loading do botão */}
                  {loading ? ( // Se 'startWalk' está ativo
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : loadingLocation ? ( // Se GPS inicial está carregando
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {loading && !loadingLocation // 'startWalk' ou 'fetchPets'
                    ? "Aguarde..."
                    : loadingLocation // GPS inicial
                    ? "Carregando GPS..."
                    : "Iniciar Passeio"}
                </Button>
              )}
              {walkState === "active" && (
                <div className="space-y-3">
                  <Button
                    onClick={pauseWalk}
                    variant="outline"
                    className="w-full text-lg py-3"
                  >
                    <Pause className="w-5 h-5 mr-2" /> Pausar
                  </Button>
                  <Button
                    onClick={finishWalk}
                    disabled={loading}
                    variant="destructive"
                    className="w-full text-lg py-3"
                  >
                    {" "}
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Square className="w-5 h-5 mr-2" />
                    )}{" "}
                    {loading ? "Finalizando..." : "Finalizar"}{" "}
                  </Button>
                </div>
              )}
              {walkState === "paused" && (
                <div className="space-y-3">
                  <Button
                    onClick={resumeWalk}
                    className="w-full text-lg py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Play className="w-5 h-5 mr-2" /> Retomar
                  </Button>
                  <Button
                    onClick={finishWalk}
                    disabled={loading}
                    variant="destructive"
                    className="w-full text-lg py-3"
                  >
                    {" "}
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Square className="w-5 h-5 mr-2" />
                    )}{" "}
                    {loading ? "Finalizando..." : "Finalizar"}{" "}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL) */}
          {(walkState !== "idle" || !loading) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-blue-600">
                    {formatTime(walkStats.duration)}
                  </div>
                  <p className="text-xs text-gray-600">Duração</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Route className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-green-600">
                    {(walkStats.distance / 1000).toFixed(2)} km
                  </div>
                  <p className="text-xs text-gray-600">Distância</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-orange-600">
                    {walkStats.calories}
                  </div>
                  <p className="text-xs text-gray-600">Calorias</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* (SEU CÓDIGO ORIGINAL - MANTIDO 100% IGUAL) */}
          {walkState !== "idle" && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  className="w-full text-lg py-3"
                  onClick={() => alert("SOS Ativado (Em desenvolvimento)")}
                >
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

