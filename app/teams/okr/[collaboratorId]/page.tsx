"use client";

import { useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function RedirectContent() {
  const router = useRouter();
  const params = useParams<{ collaboratorId: string }>();

  useEffect(() => {
    router.replace(`/teams/${params.collaboratorId}?tab=okr`);
  }, [params.collaboratorId, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-gray-400" />
    </div>
  );
}

export default function CollaboratorOkrRedirect() {
  return (
    <Suspense>
      <RedirectContent />
    </Suspense>
  );
}
