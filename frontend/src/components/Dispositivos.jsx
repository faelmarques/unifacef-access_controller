import { useState, useEffect } from 'react'
import {
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  Copy,
  Loader2,
  X,
  CheckCircle
} from 'lucide-react'
import { buscarDispositivos, criarDispositivo, deletarDispositivo } from '../api/api'
import toast from 'react-hot-toast'

function ModalDispositivo({ aberto, onClose, onSalvar }) {
  const [formData, setFormData] = useState({ nome: '', localizacao: '' })
  const [salvando, setSalvando] = useState(false)
  const [chaveCopiada, setChaveCopiada] = useState(false)
  const [novoDispositivo, setNovoDispositivo] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome do dispositivo e obrigatorio')
      return
    }

    setSalvando(true)

    try {
      const resultado = await criarDispositivo(formData)
      setNovoDispositivo(resultado)
      toast.success('Dispositivo cadastrado com sucesso')
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar dispositivo')
    } finally {
      setSalvando(false)
    }
  }

  function copiarChave() {
    if (novoDispositivo?.api_key) {
      navigator.clipboard.writeText(novoDispositivo.api_key)
      setChaveCopiada(true)
      toast.success('Chave copiada!')
      setTimeout(() => setChaveCopiada(false), 2000)
    }
  }

  function handleFechar() {
    setFormData({ nome: '', localizacao: '' })
    setNovoDispositivo(null)
    setChaveCopiada(false)
    onClose()
    onSalvar()
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Novo Dispositivo</h2>
          <button onClick={handleFechar} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {novoDispositivo ? (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Dispositivo cadastrado!</span>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Copie a chave abaixo e configure no seu ESP32:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-3 rounded border text-sm font-mono break-all">
                  {novoDispositivo.api_key}
                </code>
                <button
                  onClick={copiarChave}
                  className="p-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                >
                  {chaveCopiada ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-green-600" />
                  )}
                </button>
              </div>
            </div>

            <button onClick={handleFechar} className="w-full btn-primary justify-center">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label">Nome do Dispositivo *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Cancela Principal"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Localizacao</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Entrada Principal"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleFechar}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="btn-primary flex-1 justify-center"
              >
                {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Cadastrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Dispositivos() {
  const [dispositivos, setDispositivos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    carregarDispositivos()
  }, [])

  async function carregarDispositivos() {
    setCarregando(true)
    try {
      const dados = await buscarDispositivos()
      setDispositivos(dados)
    } catch (err) {
      toast.error('Erro ao carregar dispositivos')
    } finally {
      setCarregando(false)
    }
  }

  async function handleDeletar(id) {
    if (!confirm('Tem certeza que deseja remover este dispositivo?')) return

    try {
      await deletarDispositivo(id)
      toast.success('Dispositivo removido')
      carregarDispositivos()
    } catch (err) {
      toast.error('Erro ao remover dispositivo')
    }
  }

  function verificarOnline(dispositivo) {
    if (!dispositivo.ultimo_heartbeat) return false
    const ultimaVez = new Date(dispositivo.ultimo_heartbeat)
    const agora = new Date()
    const diferencaMinutos = (agora - ultimaVez) / (1000 * 60)
    return diferencaMinutos < 5
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dispositivos</h1>
          <p className="text-gray-500">Gerencie os ESP32s conectados ao sistema</p>
        </div>
        <button onClick={() => setModalAberto(true)} className="btn-primary">
          <Plus className="h-5 w-5" />
          Novo Dispositivo
        </button>
      </div>

      {/* Lista de dispositivos */}
      <div className="card">
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-facef-500" />
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="text-center py-12">
            <Wifi className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhum dispositivo cadastrado</p>
            <p className="text-sm text-gray-400">
              Cadastre um dispositivo para gerar a chave de acesso do ESP32
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dispositivos.map((dispositivo) => {
              const online = verificarOnline(dispositivo)

              return (
                <div
                  key={dispositivo.id}
                  className={`border rounded-xl p-4 ${
                    online ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {online ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeletar(dispositivo.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold mb-1">{dispositivo.nome}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {dispositivo.localizacao || 'Sem localizacao'}
                  </p>

                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-xs text-gray-500 mb-1">API Key:</p>
                    <code className="text-xs font-mono break-all">
                      {dispositivo.api_key.substring(0, 20)}...
                    </code>
                  </div>

                  {dispositivo.ultimo_heartbeat && (
                    <p className="text-xs text-gray-400 mt-2">
                      Ultimo sinal: {new Date(dispositivo.ultimo_heartbeat).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Instrucoes */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Configuracao do ESP32</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Cadastre um dispositivo para gerar a chave de acesso</li>
          <li>Copie a API Key gerada</li>
          <li>Cole a chave no arquivo de configuracao do firmware ESP32</li>
          <li>Configure o Wi-Fi e faca o upload do firmware</li>
          <li>O dispositivo aparecera aqui como "Online" quando conectar</li>
        </ol>
      </div>

      {/* Modal */}
      <ModalDispositivo
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        onSalvar={carregarDispositivos}
      />
    </div>
  )
}
