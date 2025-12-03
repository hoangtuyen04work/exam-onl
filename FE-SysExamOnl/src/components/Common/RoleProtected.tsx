import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface RoleProtectedProps {
  children: ReactNode;
}

export default function RoleProtected({  children }: RoleProtectedProps) {
  const role = localStorage.getItem("selectedRole");
  if (!role) {
  return <Navigate to="/role-select" replace />;
}

  return children;
}
