"use client";

import { useState } from "react";

const formatoPesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

function soloDigitos(texto: string) {
  return texto.replace(/\D/g, "");
}

function mostrar(digitos: string) {
  return digitos ? `$ ${formatoPesos.format(Number(digitos))}` : "";
}

/**
 * Campo de dinero: el usuario ve "$ 1.500.000" mientras escribe, y el
 * formulario envía solo los dígitos ("1500000") en un input oculto con `name`.
 */
export function InputMoneda({
  name,
  id,
  defaultValue = "",
  placeholder = "$ 0",
  required,
  className,
  value,
  onValueChange,
}: {
  name: string;
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** Modo controlado (solo dígitos): el padre puede vaciarlo, p. ej. tras guardar. */
  value?: string;
  onValueChange?: (digitos: string) => void;
}) {
  const [interno, setInterno] = useState(soloDigitos(defaultValue.split(".")[0]));
  const digitos = value ?? interno;
  const setDigitos = (nuevo: string) => {
    setInterno(nuevo);
    onValueChange?.(nuevo);
  };

  return (
    <>
      <input type="hidden" name={name} value={digitos} />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={placeholder}
        value={mostrar(digitos)}
        onChange={(evento) => setDigitos(soloDigitos(evento.target.value))}
        className={className}
      />
    </>
  );
}
