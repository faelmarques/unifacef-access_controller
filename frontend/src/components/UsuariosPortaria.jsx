import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Key
} from 'lucide-react'
import {
  buscarUsuariosPortaria,
  criarUsuarioPortaria,
  atualizarUsuarioPortaria,
  desativarUsuarioPortaria,
  reativarUsuarioPortaria
} from '../api/api'
import toast from 'react-hot-toast'

function ModalUsuario({ aberto, onClose, usuario, onSalvar }) {
  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    senha: ''
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome || '',
        usuario: usuario.usuario || '',
        senha: ''
      })
    } else {
      setFormData({ nome: '', usuario: '', senha: '' })
    }
  }, [usuario, aberto])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.nome || !formData.usuario) {
      toast.error('Nome e usuario sao obrigatorios')
      return
    }

    if (!usuario && !formData.senha) {
      toast.error('Senha e obrigatoria para novo usuario')
      return
    }

    setSalvando(true)

    try {
      if (usuario) {
        const dadosAtualizacao = {
          nome: formData.nome,
          usuario: formData.usuario
        }
        if (formData.senha) {
          dadosAtualizacao.senha = formData.senha
        }
        await atualizarUsuarioPortaria(usuario.id, dadosAtualizacao)
        toast.success('Usuario atualizado com sucesso')
      } else {
        await criarUsuarioPortaria(formData)
        toast.success('Usuario cadastrado com sucesso')
      }
      onSalvar()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar usuario')
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {usuario ? 'Editar Operador' : 'Novo Operador de Portaria'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nome Completo *</label>
            <input
              type="text"
              className="input"
              placeholder="Nome do operador"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Usuario *</label>
            <input
              type="text"
              className="input"
              placeholder=" usuario para login"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
              disabled={!!usuario}
            />
          </div>

          <div>
            <label className="label">
              {usuario ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
            </label>
            <input
              type="password"
              className="input"
              placeholder="Senha de acesso"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary flex-1 justify-center"
            >
              {salvando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : usuario ? (
                'Salvar Alteracoes'
              ) : (
                'Cadastrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsuariosPortaria() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    try {
      const dados = await buscarUsuariosPortaria()
      setUsuarios(dados)
    } catch (err) {
      toast.error('Erro ao carregar usuarios')
    } finally {
      setCarregando(false)
    }
  }

  async function handleDesativar(id) {
    if (!confirm('Tem certeza que deseja desativar este operador?')) return

    try {
      await desativarUsuarioPortaria(id)
      toast.success('Operador desativado')
      carregarUsuarios()
    } catch (err) {
      toast.error('Erro ao desativar operador')
    }
  }

  async function handleReativar(id) {
    try {
      await reativarUsuarioPortaria(id)
      toast.success('Operador reativado')
      carregarUsuarios()
    } catch (err) {
      toast.error('Erro ao reativar operador')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Operadores de Portaria</h1>
          <p className="text-gray-500">Gerencie os usuarios que acessam a tela da portaria</p>
        </div>
        <button
          onClick={() => {
            setUsuarioEditando(null)
            setModalAberto(true)
          }}
          className="btn-primary"
        >
          <Plus className="h-5 w-5" />
          Novo Operador
        </button>
      </div>

      {/* Lista de usuarios */}
      <div className="card">
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-facef-500" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhum operador cadastrado</p>
            <p className="text-sm text-gray-400">
              Cadastre operadores para acessar a tela da portaria
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Usuario</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Criado em</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {user.ativo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">{user.nome}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Key className="h-3 w-3" />
                        {user.usuario}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(user.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setUsuarioEditando(user)
                            setModalAberto(true)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {user.ativo ? (
                          <button
                            onClick={() => handleDesativar(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Desativar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativar(user.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Reativar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instrucoes */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Como funciona?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Cada operador tem seu proprio login e senha para acessar a tela da portaria</li>
          <li>• Todas as acoes (abrir/fechar cancela) sao registradas com o nome do operador</li>
          <li>• Operadores desativados nao conseguem fazer login na portaria</li>
          <li>• Acesse a portaria em: <strong>/portaria</strong></li>
        </ul>
      </div>

      {/* Modal */}
      <ModalUsuario
        aberto={modalAberto}
        onClose={() => {
          setModalAberto(false)
          setUsuarioEditando(null)
        }}
        usuario={usuarioEditando}
        onSalvar={carregarUsuarios}
      />
    </div>
  )
}
