import React from 'react';
import RoleManagement from '../components/RoleManagement';
import { UserCog } from 'lucide-react';

export default function AdminRoles() {
  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4">
          <UserCog size={40} className="text-teal-600" /> User Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage platform roles and user permissions globally.</p>
      </div>
      <RoleManagement />
    </div>
  );
}
