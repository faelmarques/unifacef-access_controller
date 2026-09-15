import { useState, useEffect } from 'react'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Building
} from 'lucide-react'
import {
  buscarLocais,
  criarLocal,
  atualizarLocal,
  desativarLocal,
  reativarLocal
} from '../api/api'
import toast from 'react-hot-toast'

function ModalLocal({ aberto, onClose, local, onSalvar }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (local) {
      setFormData({
        nome: local.nome || '',
        descricao: local.descricao || ''
      })
    } else {
      setFormData({ nome: '', descricao: '' })
    }
  }, [local, aberto])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome do local e obrigatorio')
      return
    }

    setSalvando(true)

    try {
      if (local) {
        await atualizarLocal(local.id, formData)
        toast.success('Local atualizado com sucesso')
      } else {
        await criarLocal(formData)
        toast.success('Local cadastrado com sucesso')
      }
      onSalvar()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar local')
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
            {local ? 'Editar Local' : 'Novo Local'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nome do Local *</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Estacionamento Cima Unidade 2"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Descricao</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Descricao opcional do local..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
              ) : local ? (
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

export default function Locais() {
  const [locais, setLocais] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [localEditando, setLocalEditando] = useState(null)

  useEffect(() => {
    carregarLocais()
  }, [])

  async function carregarLocais() {
    setCarregando(true)
    try {
      const dados = await buscarLocais()
      setLocais(dados)
    } catch (err) {
      toast.error('Erro ao carregar locais')
    } finally {
      setCarregando(false)
    }
  }

  async function handleDesativar(id) {
    if (!confirm('Tem certeza que deseja desativar este local?')) return

    try {
      await desativarLocal(id)
      toast.success('Local desativado')
      carregarLocais()
    } catch (err) {
      toast.error('Erro ao desativar local')
    }
  }

  async function handleReativar(id) {
    try {
      await reativarLocal(id)
      toast.success('Local reativado')
      carregarLocais()
    } catch (err) {
      toast.error('Erro ao reativar local')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Locais</h1>
          <p className="text-gray-500">Gerencie os estacionamentos, unidades eAreas</p>
        </div>
        <button
          onClick={() => {
            setLocalEditando(null)
            setModalAberto(true)
          }}
          className="btn-primary"
        >
          <Plus className="h-5 w-5" />
          Novo Local
        </button>
      </div>

      {/* Lista de locais */}
      <div className="card">
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-facef-500" />
          </div>
        ) : locais.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhum local cadastrado</p>
            <p className="text-sm text-gray-400">
              Cadastre locais como estacionamentos, unidades, etc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locais.map((local) => (
              <div
                key={local.id}
                className={`border rounded-xl p-4 ${
                  local.ativo ? 'border-gray-200' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-facef-500" />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      local.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {local.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setLocalEditando(local)
                        setModalAberto(true)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {local.ativo ? (
                      <button
                        onClick={() => handleDesativar(local.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReativar(local.id)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{local.nome}</h3>
                {local.descricao && (
                  <p className="text-sm text-gray-500 mb-3">{local.descricao}</p>
                )}

                <div className="text-xs text-gray-400">
                  Criado em: {new Date(local.criado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instrucoes */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Como funciona?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Cadastre locais como <strong>"Estacionamento Cima Unidade 2"</strong>, <strong>"Estacionamento Baixo"</strong>, etc.</li>
          <li>• Vincule cancelas, sensores e operadores a cada local</li>
          <li>• Cada local tem seu proprio historico de acessos</li>
          <li>• Operadores podem ser vinculados a locais especificos</li>
        </ul>
      </div>

      {/* Modal */}
      <ModalLocal
        aberto={modalAberto}
        onClose={() => {
          setModalAberto(false)
          setLocalEditando(null)
        }}
        local={localEditando}
        onSalvar={carregarLocais}
      />
    </div>
  )
}
