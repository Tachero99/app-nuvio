"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readStoredUser, type StoredUser } from "@/lib/auth";

export function useDashboardGuard() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const u = readStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.role === "SUPERADMIN") {
      router.replace("/admin");
      return;
    }
    setUser(u);
  }, [router]);

  return user;
}
