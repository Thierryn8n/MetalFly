import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock do Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('Admin Usuários API', () => {
  let mockSupabase: any
  let mockAuth: any
  let mockFrom: any

  beforeAll(() => {
    // Setup do mock do Supabase
    mockAuth = {
      getUser: jest.fn(),
      admin: {
        createUser: jest.fn()
      }
    }
    
    mockFrom = jest.fn()
    
    mockSupabase = {
      auth: mockAuth,
      from: mockFrom
    }
    
    ;(require('@/lib/supabase/server').createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/usuarios', () => {
    it('deve retornar lista de usuários para admin', async () => {
      // Mock de autenticação
      const mockUser = { id: '1', email: 'admin@teste.com' }
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      // Mock de perfil admin
      const mockProfile = { role: 'admin' }
      
      // Mock de usuários
      const mockUsuarios = [
        {
          id: '2',
          full_name: 'Usuário 1',
          email: 'user1@teste.com',
          role: 'user',
          status: 'active',
          created_at: '2024-01-01',
          lojas: null
        },
        {
          id: '3',
          full_name: 'Usuário 2',
          email: 'user2@teste.com',
          role: 'manager_loja',
          status: 'active',
          created_at: '2024-01-02',
          lojas: { id: '1', name: 'Loja 1', slug: 'loja-1' }
        }
      ]

      let profileCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockImplementation(() => {
              profileCallCount++
              if (profileCallCount === 1) {
                // Primeira chamada - verificar perfil do admin
                return Promise.resolve({ data: mockProfile, error: null })
              }
            }),
            order: jest.fn().mockResolvedValue({ data: mockUsuarios, error: null }),
            or: jest.fn().mockReturnThis()
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      const { GET } = require('../route')
      const request = new NextRequest('http://localhost:3000/api/admin/usuarios')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('usuarios')
      expect(data.usuarios).toHaveLength(2)
    })

    it('deve retornar erro 401 se usuário não estiver autenticado', async () => {
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } })

      const { GET } = require('../route')
      const request = new NextRequest('http://localhost:3000/api/admin/usuarios')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Não autorizado')
    })

    it('deve retornar erro 403 se usuário não for admin', async () => {
      const mockUser = { id: '1', email: 'user@teste.com' }
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const mockProfile = { role: 'user' }
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      const { GET } = require('../route')
      const request = new NextRequest('http://localhost:3000/api/admin/usuarios')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Apenas administradores podem ver usuários')
    })
  })

  describe('POST /api/admin/usuarios', () => {
    it('deve criar novo usuário', async () => {
      const mockUser = { id: '1', email: 'admin@teste.com' }
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const mockProfile = { role: 'admin' }
      
      const novoUsuario = {
        email: 'novo@teste.com',
        password: 'senha123',
        full_name: 'Novo Usuário',
        role: 'user'
      }

      const usuarioCriado = {
        id: '4',
        full_name: 'Novo Usuário',
        email: 'novo@teste.com',
        role: 'user',
        status: 'active',
        created_at: '2024-01-03',
        lojas: null,
        phone: null,
        cpf: null,
        endereco: {}
      }

      // Mock do auth.admin.createUser
      mockAuth.admin.createUser.mockResolvedValue({
        data: { user: { id: '4' } },
        error: null
      })

      // Mock simples para todas as operações de profiles
      let singleCallCount = 0
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockImplementation(() => {
              singleCallCount++
              console.log(`single() chamado ${singleCallCount}ª vez`)
              if (singleCallCount === 1) {
                console.log('Retornando perfil admin:', mockProfile)
                return Promise.resolve({ data: mockProfile, error: null })
              } else {
                console.log('Retornando usuário criado:', usuarioCriado)
                return Promise.resolve({ data: usuarioCriado, error: null })
              }
            }),
            insert: jest.fn().mockReturnThis()
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      const { POST } = require('../route')
      const request = new NextRequest('http://localhost:3000/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify(novoUsuario)
      })
      const response = await POST(request)
      const data = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', data)

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('usuario')
      expect(data.usuario.email).toBe('novo@teste.com')
    })

    it('deve retornar erro 400 se dados forem inválidos', async () => {
      const mockUser = { id: '1', email: 'admin@teste.com' }
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const mockProfile = { role: 'admin' }
      
      // Mock simples para todas as operações de profiles
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      const { POST } = require('../route')
      const request = new NextRequest('http://localhost:3000/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({ email: 'teste@teste.com' }) // Falta senha e nome
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Senha deve ter pelo menos 6 caracteres')
    })

    it('deve retornar erro 403 se usuário não for admin', async () => {
      const mockUser = { id: '1', email: 'manager@teste.com' }
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const mockProfile = { role: 'manager_loja' }
      
      // Mock simples para todas as operações de profiles
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      const { POST } = require('../route')
      const request = new NextRequest('http://localhost:3000/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          email: 'novo@teste.com',
          password: 'senha123',
          full_name: 'Novo Usuário'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Apenas administradores podem criar usuários')
    })
  })
})