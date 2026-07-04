"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton({ label = "Déconnexion" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button className="logout-btn" onClick={handleLogout} disabled={pending}>
      {pending ? "..." : label}
    </button>
  );
}
