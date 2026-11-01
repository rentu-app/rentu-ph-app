// Solo lectura: lista usuarios cuyo email tiene mayúsculas. No modifica nada.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, email: true, rol: true, deletedAt: true },
  });
  const conMayusculas = usuarios.filter((u) => u.email !== u.email.toLowerCase());
  console.log(`Usuarios con mayúsculas en el email: ${conMayusculas.length} de ${usuarios.length}`);
  for (const u of conMayusculas) {
    console.log(`${u.id}\t${u.email}\t${u.rol}${u.deletedAt ? "\t(eliminado)" : ""}`);
  }
}

main().finally(() => prisma.$disconnect());
