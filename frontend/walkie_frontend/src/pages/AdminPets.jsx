import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

const AdminPets = () => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

  // Checagem de segurança
  if (!currentUser || currentUser.role !== "admin") {
    toast.error("Acesso negado. Você precisa ser um administrador.");
    return <Navigate to="/dashboard" replace />;
  }

  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/admin/pets");
      setPets(response.data);
    } catch (error) {
      toast.error(
        "Falha ao carregar pets: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDeletePet = async (petId, petName) => {
    if (
      !window.confirm(
        `Tem certeza que deseja EXCLUIR o pet '${petName}' (ID: ${petId})?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/admin/pets/${petId}`);
      toast.success(`Pet ${petName} excluído com sucesso.`);
      fetchPets(); // Recarrega a lista
    } catch (error) {
      toast.error(
        "Falha ao excluir: " + (error.response?.data?.error || error.message)
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Gerenciamento de Pets</CardTitle>
        <Button onClick={fetchPets} variant="outline" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Atualizar"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Raça</TableHead>
                <TableHead>ID Dono</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pets.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell className="font-medium">{pet.id}</TableCell>
                  <TableCell>{pet.name}</TableCell>
                  <TableCell>{pet.breed || "N/A"}</TableCell>
                  <TableCell>{pet.owner_id}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePet(pet.id, pet.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPets;
