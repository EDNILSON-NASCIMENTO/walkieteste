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
import { toast } from "sonner"; // Assumindo que você usa sonner
import { Loader2, Trash2, Pencil, ShieldAlert } from "lucide-react";

// Componente simples de modal (para edição)
const EditUserModal = ({ user, onClose, onSave }) => {
  const [role, setRole] = useState(user.role);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(user.id, { name, email, role });
      toast.success("Usuário atualizado com sucesso!");
      onClose();
    } catch (error) {
      toast.error(error.message || "Falha ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Usuário: {user.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role (função)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const { user: currentUser } = useAuth();

  // Checagem de segurança
  if (!currentUser || currentUser.role !== "admin") {
    toast.error("Acesso negado. Você precisa ser um administrador.");
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // O axios usará a baseURL e o token de autenticação globais
      const response = await axios.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      toast.error(
        "Falha ao carregar usuários: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (userId === currentUser.id) {
      toast.error("Você não pode excluir sua própria conta.");
      return;
    }
    if (
      !window.confirm(
        `Tem certeza que deseja EXCLUIR o usuário '${userName}' (ID: ${userId})?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/admin/users/${userId}`);
      toast.success(`Usuário ${userName} excluído com sucesso.`);
      fetchUsers(); // Recarrega a lista
    } catch (error) {
      toast.error(
        "Falha ao excluir: " + (error.response?.data?.error || error.message)
      );
    }
  };

  const handleSaveUser = async (userId, data) => {
    try {
      await axios.put(`/admin/users/${userId}`, data);
      fetchUsers(); // Recarrega a lista
    } catch (error) {
      throw new Error(error.response?.data?.error || "Erro ao salvar");
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciamento de Usuários</CardTitle>
          <Button onClick={fetchUsers} variant="outline" disabled={isLoading}>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    className={u.role === "admin" ? "bg-red-50" : ""}
                  >
                    <TableCell className="font-medium">{u.id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell
                      className={`font-bold ${
                        u.role === "admin" ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-right flex space-x-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(u)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={u.id === currentUser.id} // Não pode se auto-excluir
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
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </>
  );
};

export default AdminUsers;
