declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    org_id: string
    role: 'admin' | 'underwriter'
  }
}

export {}
