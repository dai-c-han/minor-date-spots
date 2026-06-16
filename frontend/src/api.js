import axios from 'axios'

// 本番(Netlify)では '' = 同一オリジン、ローカルは localhost:8000
const BASE = import.meta.env.VITE_API_BASE ?? ''

export const api = axios.create({ baseURL: BASE })
