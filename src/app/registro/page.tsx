import type { Metadata } from "next";
import Link from "next/link";
import { RegistroForm } from "@/components/auth/registro-form";
import { MarcaAuth } from "@/components/auth/marca-auth";

export const metadata: Metadata = {
  title: "Crear cuenta · Rentu",
};

export default function RegistroPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <MarcaAuth descripcion="Crea tu cuenta de Administrador y registra tu copropiedad" />
        <RegistroForm />
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
