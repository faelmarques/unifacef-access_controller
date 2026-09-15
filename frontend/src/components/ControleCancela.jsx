import { useState, useEffect } from 'react'
import {
  DoorOpen,
  DoorClosed,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { abrirCancela, fecharCancela, statusCancela } from '../api/api'
import toast from 'react-hot-toast'

export default function ControleCancela() {
  const [status, setStatus] = useState({ aberta: false, motivo: null, ultimaOperacao: null })
  const [carregando, setCarregando] = useState(true)
  const [operando, setOperando] = useState(false)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    carregarStatus()
    const intervalo = setInterval(carregarStatus, 5000)
    return () => clearInterval(intervalo)
  }, [])

  async function carregarStatus() {
    try {
      const dados = await statusCancela()
      setStatus(dados)
    } catch (err) {
      console.error('Erro ao carregar status:', err)
    } finally {
      setCarregando(false)
    }
  }

  async function handleAbrir() {
    setOperando(true)
    try {
      await abrirCancela(motivo || 'Manual - Dashboard')
      toast.success('Cancela aberta com sucesso')
      setMotivo('')
      await carregarStatus()
    } catch (err) {
      toast.error('Erro ao abrir cancela')
    } finally {
      setOperando(false)
    }
  }

  async function handleFechar() {
    setOperando(true)
    try {
      await fecharCancela()
      toast.success('Cancela fechada com sucesso')
      await carregarStatus()
    } catch (err) {
      toast.error('Erro ao fechar cancela')
    } finally {
      setOperando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-facef-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Controle da Cancela</h1>
        <p className="text-gray-500">Abra e feche a cancela manualmente pelo painel</p>
      </div>

      {/* Status atual */}
      <div className={`card ${status.aberta ? 'border-green-200' : 'border-red-200'}`}>
        <div className="flex flex-col items-center py-8">
          {status.aberta ? (
            <DoorOpen className="h-32 w-32 text-green-500 mb-6" />
          ) : (
            <DoorClosed className="h-32 w-32 text-red-500 mb-6" />
          )}

          <h2 className="text-3xl font-bold mb-2">
            Cancela {status.aberta ? 'Aberta' : 'Fechada'}
          </h2>

          {status.motivo && (
            <p className="text-gray-500 mb-2">
              Motivo: <span className="font-medium">{status.motivo}</span>
            </p>
          )}

          {status.ultimaOperacao && (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ultima operacao: {new Date(status.ultimaOperacao).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Abrir cancela */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Unlock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Abrir Cancela</h3>
              <p className="text-sm text-gray-500">Libera a entrada do estacionamento</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Motivo (opcional)</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Manutencao, Entrega..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <button
              onClick={handleAbrir}
              disabled={operando || status.aberta}
              className="w-full btn-success justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {operando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <DoorOpen className="h-5 w-5" />
              )}
              Abrir Cancela
            </button>

            {status.aberta && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                A cancela ja esta aberta
              </div>
            )}
          </div>
        </div>

        {/* Fechar cancela */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Fechar Cancela</h3>
              <p className="text-sm text-gray-500">Bloqueia a entrada do estacionamento</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-[52px]"></div>

            <button
              onClick={handleFechar}
              disabled={operando || !status.aberta}
              className="w-full btn-danger justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {operando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <DoorClosed className="h-5 w-5" />
              )}
              Fechar Cancela
            </button>

            {!status.aberta && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                A cancela ja esta fechada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instrucoes */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Como funciona?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• A cancela eh controlada automaticamente quando um carro com tag autorizada se aproxima</li>
          <li>• Use este painel para abrir manualmente em casos especiais (manutencao, emergencia, etc)</li>
          <li>• Todas as operacoes sao registradas no historico de acessos</li>
          <li>• O status eh atualizado automaticamente a cada 5 segundos</li>
        </ul>
      </div>
    </div>
  )
}
