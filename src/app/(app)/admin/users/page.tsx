"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRoleDisplayName } from "@/lib/utils";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  managerId: string | null;
  manager: { id: string; name: string } | null;
}

const ROLES = ["EMPLOYEE", "MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [session, router]);

  function loadUsers() {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setShowAddForm(false);
      setNewUser({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
      loadUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create user");
    }
    setCreating(false);
  }

  async function updateUser(userId: string, data: Record<string, unknown>) {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    loadUsers();
  }

  const managers = users.filter((u) => ["MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"].includes(u.role));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Add users, assign roles and managers</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Add New User</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory focus:border-visory"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{getRoleDisplayName(r)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                  <select
                    value={newUser.managerId}
                    onChange={(e) => setNewUser((u) => ({ ...u, managerId: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-visory focus:border-visory"
                  >
                    <option value="">No Manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    {!user.isActive && (
                      <Badge className="bg-red-100 text-red-800 border-red-300">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.manager && (
                    <p className="text-xs text-gray-400">Reports to: {user.manager.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, { role: e.target.value })}
                    disabled={user.id === session?.user?.id}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-visory"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{getRoleDisplayName(r)}</option>
                    ))}
                  </select>
                  <select
                    value={user.managerId || ""}
                    onChange={(e) => updateUser(user.id, { managerId: e.target.value || null })}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-visory"
                  >
                    <option value="">No Manager</option>
                    {managers.filter((m) => m.id !== user.id).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant={user.isActive ? "danger" : "secondary"}
                    onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                    disabled={user.id === session?.user?.id}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
