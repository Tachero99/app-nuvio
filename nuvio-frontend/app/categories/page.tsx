"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";


// Mantener /categories por compatibilidad, pero el ABM vive en /dashboard/categories
export default function CategoriesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/categories");
  }, [router]);

  return null;
}
