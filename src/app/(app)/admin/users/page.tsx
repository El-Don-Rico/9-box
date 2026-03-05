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

interface InvitationData {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
  usedAt: string | null;
  createdAt: string;
}

const ROLES = ["EMPLOYEE", "MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newInvite, setNewInvite] = useState({ name: "", email: "", role: "EMPLOYEE", managerId: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
    loadInvitations();
  }, [session, router]);

  function loadUsers() {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  }

  function loadInvitations() {
    fetch("/api/admin/invitations").then((r) => r.json()).then(setInvitations);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInvite),
    });
    if (res.ok) {
      setShowInviteForm(false);
      setNewInvite({ name: "", email: "", role: "EMPLOYEE", managerId: "" });
      loadInvitations();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create invitation");
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

  function getInviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  function copyInviteLink(token: string) {
    navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const managers = users.filter((u) => ["MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"].includes(u.role));
  const pendingInvitations = invitations.filter((i) => !i.usedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">Invite users and manage roles</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          {showInviteForm ? "Cancel" : "Invite User"}
        </Button>
      </div>

      {showInviteForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Invite New User</h2>
            <p className="text-xs text-gray-500">They will receive a link to set their own password</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendInvite} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={newInvite.name}
                  onChange={(e) => setNewInvite((u) => ({ ...u, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite((u) => ({ ...u, email: e.target.value }))}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newInvite.role}
                    onChange={(e) => setNewInvite((u) => ({ ...u, role: e.target.value }))}
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
                    value={newInvite.managerId}
                    onChange={(e) => setNewInvite((u) => ({ ...u, managerId: e.target.value }))}
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
                {creating ? "Creating..." : "Create Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Pending Invitations</h2>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                    <p className="text-xs text-gray-500">{inv.email}</p>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs mt-1">
                      {getRoleDisplayName(inv.role)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyInviteLink(inv.token)}
                  >
                    {copiedToken === inv.token ? "Copied!" : "Copy Invite Link"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Users */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Active Users</h2>
        </CardHeader>
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
