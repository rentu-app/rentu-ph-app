import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Rentu",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Rentu</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Inicia sesión como Administrador
          </p>
        </div>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
