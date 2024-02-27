"use client";

import { Unauthorized } from "@/components/index";
import { superAdmins } from "@/constants";

import { useSupabase } from "@/context/SupabaseProvider";

export default function PmsLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSupabase();

  // Check access from permission settings or Super Admins
  if (!superAdmins.includes(session.user.email)) return <Unauthorized />;

  return <>{children}</>;
}
