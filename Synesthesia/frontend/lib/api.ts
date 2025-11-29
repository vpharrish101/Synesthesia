const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ApiError {
  status: number
  detail: string
}

async function apiCall<T>(method: string, path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  let retries = 2
  while (retries >= 0) {
    try {
      const response = await fetch(url.toString(), options)
      if (!response.ok) {
        throw {
          status: response.status,
          detail: `HTTP ${response.status}`,
        } as ApiError
      }
      return await response.json()
    } catch (error) {
      if (retries === 0) throw error
      retries--
      await new Promise((r) => setTimeout(r, 1000 * (3 - retries)))
    }
  }
  throw new Error("API call failed")
}

export const api = {
  health: () => apiCall<{ status: string }>("GET", "/health"),
  getEmails: () => apiCall<any[]>("GET", "/emails"),
  getEmail: (id: string) => apiCall<any>("GET", `/email/${id}`),
  updateEmail: (id: string, updates: unknown) => apiCall<void>("PATCH", `/email/${id}`, updates),
  search: (q: string) => apiCall<any[]>("GET", "/search", undefined, { q }),
  getPrompts: () => apiCall<Record<string, string>>("GET", "/prompts/get_all"),
  updatePrompts: (data: unknown) => apiCall<{ status: string }>("POST", "/prompts/change_one", data),
  ask: (email_id: string, question: string) => apiCall<any>("POST", "/ds7m/ask", { email_id, question }),
  superquery: (question: string) => apiCall<{ answer: string }>("POST", "/ds7m/superquery", { question }),
  autodraft: (email_id: string, prompt: string) =>
  apiCall<{ draft: string }>(
    "POST",
    `/ds7m/autodraft`,
    {},                    // required otherwise it becomes a GET
    { email_id, prompt }   // ALWAYS send both
  ),
  getDrafts: () => apiCall<any[]>("GET", "/drafts"),
  addDraft: (recipient: string, subject: string, body: string) =>
    apiCall("POST", "/drafts/add_one", undefined, {
      recipient,
      subject,
      body,
    }),
  uploadEmails: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`${API_BASE}/email/upload`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Upload failed")
    }

    return res.json()
  },

}

