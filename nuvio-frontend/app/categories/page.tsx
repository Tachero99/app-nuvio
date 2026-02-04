"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { notify } from "@/lib/notify";

const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

// Mantener /categories por compatibilidad, pero el ABM vive en /dashboard/categories
export default function CategoriesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/categories");
  }, [router]);

  return null;
}
