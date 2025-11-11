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
import { Loader2, Trash2, CheckCircle } from "lucide-react";

const AdminWalks = () => {
  const [stuckWalks, setStuckWalks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

  // Checagem de segurança
  if (!currentUser || currentUser.role !== "admin") {
    toast.error("Acesso negado. Você precisa ser um administrador.");
    return <Navigate to="/dashboard" replace />;
  }

  const fetchStuckWalks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/admin/walks/stuck");
      setStuckWalks(response.data);
    } catch (error) {
      toast.error(
        "Falha ao carregar passeios: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStuckWalks();
  }, []);

  const handleAction = async (walkId, actionType) => {
    const isCompleting = actionType === "complete";
    const endpoint = isCompleting
      ? `/admin/walks/${walkId}/complete`
      : `/admin/walks/${walkId}`;
    const method = isCompleting ? "post" : "delete";
    const actionText = isCompleting ? "CONCLUIR" : "EXCLUIR";

    if (
      !window.confirm(
        `Tem certeza que deseja ${actionText} o passeio ID ${walkId}?`
      )
    ) {
      return;
    }

    try {
      await axios[method](endpoint);
      toast.success(
        `Passeio ${walkId} ${
          isCompleting ? "concluído" : "excluído"
        } com sucesso.`
      );
      fetchStuckWalks(); // Recarrega a lista
    } catch (error) {
      toast.error(
        `Falha ao ${actionText.toLowerCase()}: ` +
          (error.response?.data?.error || error.message)
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl text-red-600">
            Passeios Travados
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Passeios abertos (sem end_time) há mais de 4 horas.
          </p>
        </div>
        <Button
          onClick={fetchStuckWalks}
          variant="outline"
          disabled={isLoading}
        >
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
                <TableHead>Início (UTC)</TableHead>
                <TableHead>ID Dono</TableHead>
                <TableHead>ID Pet</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stuckWalks.length > 0 ? (
                stuckWalks.map((walk) => (
                  <TableRow
                    key={walk.id}
                    className="bg-red-50 hover:bg-red-100"
                  >
                    <TableCell className="font-medium text-red-700">
                      {walk.id}
                    </TableCell>
                    <TableCell>
                      {new Date(walk.start_time).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{walk.user_id}</TableCell>
                    <TableCell>{walk.pet_id}</TableCell>
                    <TableCell className="text-right flex space-x-2 justify-end">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAction(walk.id, "complete")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(walk.id, "delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-lg text-green-600 font-semibold"
                  >
                    🎉 Nenhum passeio travado encontrado!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminWalks;
