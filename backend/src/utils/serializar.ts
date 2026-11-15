
const filas = new Map<string, Promise<void>>();

async function serializar<T>(chave: string, operacao: () => Promise<T>): Promise<T> {
  const anterior = filas.get(chave);
  let liberar: () => void;
  const atual = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  filas.set(chave, atual);
  try {
    await anterior;
    return await operacao();
  } finally {
    liberar();
    if (filas.get(chave) === atual) filas.delete(chave);
  }
}

module.exports = serializar;
