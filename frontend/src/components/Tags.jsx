import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  X
} from 'lucide-react'
import {
  buscarTags,
  criarTag,
  atualizarTag,
  desativarTag,
  reativarTag
} from '../api/api'
import toast from 'react-hot-toast'

function ModalTag({ aberto, onClose, tag, onSalvar }) {
  const [formData, setFormData] = useState({
    codigo: '',
    proprietario: '',
    veiculo: '',
    placa: '',
    departamento: ''
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (tag) {
      setFormData({
        codigo: tag.codigo || '',
        proprietario: tag.proprietario || '',
        veiculo: tag.veiculo || '',
        placa: tag.placa || '',
        departamento: tag.departamento || ''
      })
    } else {
      setFormData({
        codigo: '',
        proprietario: '',
        veiculo: '',
        placa: '',
        departamento: ''
      })
    }
  }, [tag, aberto])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.codigo || !formData.proprietario) {
      toast.error('Codigo e proprietario sao obrigatorios')
      return
    }

    setSalvando(true)

    try {
      if (tag) {
        await atualizarTag(tag.id, formData)
        toast.success('Tag atualizada com sucesso')
      } else {
        await criarTag(formData)
        toast.success('Tag cadastrada com sucesso')
      }
      onSalvar()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar tag')
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
            {tag ? 'Editar Tag' : 'Cadastrar Nova Tag'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Codigo da Tag *</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: AA:BB:CC:DD:EE"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              disabled={!!tag}
            />
          </div>

          <div>
            <label className="label">Proprietario *</label>
            <input
              type="text"
              className="input"
              placeholder="Nome do proprietario"
              value={formData.proprietario}
              onChange={(e) => setFormData({ ...formData, proprietario: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Veiculo</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Honda Civic"
                value={formData.veiculo}
                onChange={(e) => setFormData({ ...formData, veiculo: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Placa</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: ABC-1234"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Departamento</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Docente, Administrativo"
              value={formData.departamento}
              onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
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
              ) : tag ? (
                'Salvar Alteracoes'
              ) : (
                'Cadastrar Tag'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tags() {
  const [tags, setTags] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [tagEditando, setTagEditando] = useState(null)

  useEffect(() => {
    carregarTags()
  }, [])

  async function carregarTags() {
    setCarregando(true)
    try {
      const dados = await buscarTags({ busca })
      setTags(dados)
    } catch (err) {
      toast.error('Erro ao carregar tags')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarTags()
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  async function handleDesativar(id) {
    if (!confirm('Tem certeza que deseja desativar esta tag?')) return

    try {
      await desativarTag(id)
      toast.success('Tag desativada')
      carregarTags()
    } catch (err) {
      toast.error('Erro ao desativar tag')
    }
  }

  async function handleReativar(id) {
    try {
      await reativarTag(id)
      toast.success('Tag reativada')
      carregarTags()
    } catch (err) {
      toast.error('Erro ao reativar tag')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tags RFID</h1>
          <p className="text-gray-500">Gerencie as tags de acesso autorizadas</p>
        </div>
        <button
          onClick={() => {
            setTagEditando(null)
            setModalAberto(true)
          }}
          className="btn-primary"
        >
          <Plus className="h-5 w-5" />
          Nova Tag
        </button>
      </div>

      {/* Busca */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar por codigo, proprietario ou placa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de tags */}
      <div className="card">
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-facef-500" />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma tag encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Codigo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Proprietario</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Veiculo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Placa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Departamento</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {tag.ativo ? (
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
                    <td className="py-3 px-4 font-mono text-sm">{tag.codigo}</td>
                    <td className="py-3 px-4">{tag.proprietario}</td>
                    <td className="py-3 px-4 text-gray-600">{tag.veiculo || '-'}</td>
                    <td className="py-3 px-4 font-mono text-sm">{tag.placa || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{tag.departamento || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setTagEditando(tag)
                            setModalAberto(true)
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {tag.ativo ? (
                          <button
                            onClick={() => handleDesativar(tag.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Desativar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativar(tag.id)}
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

      {/* Modal */}
      <ModalTag
        aberto={modalAberto}
        onClose={() => {
          setModalAberto(false)
          setTagEditando(null)
        }}
        tag={tagEditando}
        onSalvar={carregarTags}
      />
    </div>
  )
}
