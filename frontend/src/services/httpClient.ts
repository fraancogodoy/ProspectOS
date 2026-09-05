export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Fijate si el `py app.py` sigue corriendo.",
      0
    )
  }

  if (!response.ok) {
    let mensagem = `Error del servidor (${response.status}).`
    try {
      const dados = await response.clone().json()
      if (dados?.erro) mensagem = dados.erro
    } catch {
      // resposta não era JSON, mantém a mensagem genérica
    }
    // 401 en cualquier llamada (menos el propio intento de login, que puede
    // fallar por credenciales incorrectas y no por sesión vencida) recarga la
    // página: RequireAuth vuelve a consultar /api/auth/me y muestra el login
    // - así una sesión que expiró en el servidor no deja al usuario mirando
    // una pantalla con errores silenciosos por todos lados
    if (response.status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/me")) {
      window.location.reload()
    }
    throw new ApiError(mensagem, response.status)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const httpClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
}
