import { useState, useEffect } from 'react'
import {
  DoorOpen,
  DoorClosed,
  Shield,
  LogIn,
  LogOut,
  XCircle,
  Clock,
  Car,
  User,
  Timer,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

const API_URL = '/api'

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function BadgeTipo({ tipo }) {
  const estilos = {
    ENTRADA: 'bg-green-500',
    SAIDA: 'bg-blue-500',
    NEGADO: 'bg-red-500',
    MANUAL: 'bg-yellow-500',
    TIMER: 'bg-orange-500'
  }

  return (
    <span className={`${estilos[tipo] || 'bg-gray-500'} text-white text-xs font-bold px-2 py-1 rounded`}>
      {tipo}
    </span>
  )
}

export default function Portaria() {
  const [pin, setPin] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [status, setStatus] = useState({
    aberta: false,
    modoDefinitivo: false,
    timerAtivo: false,
    tempoRestante: 0,
    sensorCarro: false
  })
  const [ultimosAcessos, setUltimosAcessos] = useState([])
  const [operando, setOperando] = useState(false)
  const [erro, setErro] = useState('')
  const [horaAtual, setHoraAtual] = useState(new Date())

  // Atualizar relogio
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Carregar dados quando autenticado
  useEffect(() => {
    if (autenticado) {
      carregarDados()
      const intervalo = setInterval(carregarDados, 2000)
      return () => clearInterval(intervalo)
    }
  }, [autenticado])

  async function carregarDados() {
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/gate/portaria/status`),
        fetch(`${API_URL}/logs/ultimos`)
      ])

      const statusData = await statusRes.json()
      const logsData = await logsRes.json()

      setStatus(statusData)
      setUltimosAcessos(logsData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  async function verificarPin(e) {
    e.preventDefault()
    setErro('')

    try {
      const res = await fetch(`${API_URL}/gate/portaria/verificar-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })

      if (res.ok) {
        setAutenticado(true)
      } else {
        setErro('PIN invalido')
        setPin('')
      }
    } catch (err) {
      setErro('Erro ao verificar PIN')
    }
  }

  async function abrirCancela() {
    setOperando(true)
    try {
      await fetch(`${API_URL}/gate/portaria/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, motivo: 'Portaria' })
      })
      await carregarDados()
    } catch (err) {
      console.error('Erro ao abrir cancela:', err)
    } finally {
      setOperando(false)
    }
  }

  async function fecharCancela() {
    setOperando(true)
    try {
      await fetch(`${API_URL}/gate/portaria/fechar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      await carregarDados()
    } catch (err) {
      console.error('Erro ao fechar cancela:', err)
    } finally {
      setOperando(false)
    }
  }

  async function toggleModoDefinitivo() {
    setOperando(true)
    try {
      await fetch(`${API_URL}/gate/portaria/definitivo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, ativar: !status.modoDefinitivo })
      })
      await carregarDados()
    } catch (err) {
      console.error('Erro ao alterar modo definitivo:', err)
    } finally {
      setOperando(false)
    }
  }

  function logout() {
    setAutenticado(false)
    setPin('')
  }

  // Tela de login
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo-facef.png" alt="UNIFACEF" className="h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">UNIFACEF</h1>
            <p className="text-gray-400 mt-2">Controle de Portaria</p>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-white text-center mb-6">Digite o PIN</h2>

            <form onSubmit={verificarPin}>
              <input
                type="password"
                className="w-full text-center text-4xl tracking-[0.5em] bg-gray-700 text-white border-0 rounded-xl p-4 mb-4 focus:ring-2 focus:ring-facef-500 outline-none"
                placeholder="****"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setErro('')
                }}
                autoFocus
              />

              {erro && (
                <p className="text-red-400 text-center text-sm mb-4">{erro}</p>
              )}

              <button
                type="submit"
                className="w-full bg-facef-500 hover:bg-facef-600 text-white font-bold py-4 rounded-xl text-lg transition-colors"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Tela principal da portaria
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-facef.png" alt="UNIFACEF" className="h-10" />
            <div>
              <h1 className="text-xl font-bold">UNIFACEF</h1>
              <p className="text-xs text-gray-400">Controle de Portaria</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">
                {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-400">
                {horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Status da cancela */}
        <div className={`rounded-2xl p-6 text-center ${
          status.modoDefinitivo
            ? 'bg-gradient-to-r from-purple-600 to-purple-700'
            : status.aberta
              ? 'bg-gradient-to-r from-green-600 to-green-700'
              : 'bg-gradient-to-r from-red-600 to-red-700'
        }`}>
          {status.modoDefinitivo ? (
            <Unlock className="h-20 w-20 mx-auto mb-4" />
          ) : status.aberta ? (
            <DoorOpen className="h-20 w-20 mx-auto mb-4" />
          ) : (
            <DoorClosed className="h-20 w-20 mx-auto mb-4" />
          )}

          <h2 className="text-3xl font-bold mb-2">
            {status.modoDefinitivo
              ? 'MODO DEFINITIVO'
              : status.aberta
                ? 'CANCELA ABERTA'
                : 'CANCELA FECHADA'
            }
          </h2>

          {/* Timer */}
          {status.timerAtivo && !status.modoDefinitivo && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Timer className="h-6 w-6" />
              <span className="text-4xl font-mono font-bold">
                {status.tempoRestante}s
              </span>
            </div>
          )}

          {/* Sensor */}
          {status.sensorCarro && (
            <div className="flex items-center justify-center gap-2 mt-2 text-yellow-300">
              <Car className="h-5 w-5" />
              <span className="text-sm font-medium">Carro detectado - Timer resetado</span>
            </div>
          )}

          {status.modoDefinitivo && (
            <p className="text-sm opacity-80 mt-2">
              Cancela permanecera aberta ate desativar o modo definitivo
            </p>
          )}
        </div>

        {/* Botoes de controle */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={abrirCancela}
            disabled={operando || status.aberta || status.modoDefinitivo}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-8 rounded-2xl text-2xl transition-colors flex flex-col items-center gap-2"
          >
            <DoorOpen className="h-12 w-12" />
            ABRIR
          </button>

          <button
            onClick={fecharCancela}
            disabled={operando || !status.aberta || status.modoDefinitivo}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-8 rounded-2xl text-2xl transition-colors flex flex-col items-center gap-2"
          >
            <DoorClosed className="h-12 w-12" />
            FECHAR
          </button>
        </div>

        {/* Botao modo definitivo */}
        <button
          onClick={toggleModoDefinitivo}
          disabled={operando}
          className={`w-full font-bold py-6 rounded-2xl text-xl transition-colors flex items-center justify-center gap-3 ${
            status.modoDefinitivo
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {status.modoDefinitivo ? (
            <>
              <Lock className="h-8 w-8" />
              DESATIVAR MODO DEFINITIVO
            </>
          ) : (
            <>
              <Unlock className="h-8 w-8" />
              ABERTURA DEFINITIVA
            </>
          )}
        </button>

        {/* Ultimos acessos */}
        <div className="bg-gray-800 rounded-2xl p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Ultimos 5 Acessos
          </h3>

          {ultimosAcessos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum acesso registrado</p>
          ) : (
            <div className="space-y-3">
              {ultimosAcessos.map((acesso) => (
                <div
                  key={acesso.id}
                  className="bg-gray-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <BadgeTipo tipo={acesso.tipo} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="font-mono font-bold">{acesso.placa || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="h-3 w-3" />
                        <span>{acesso.proprietario || 'Nao identificado'}</span>
                      </div>
                      {acesso.veiculo && (
                        <p className="text-xs text-gray-500 mt-1">{acesso.veiculo}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-400">
                    {formatarData(acesso.criado_em)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instrucoes */}
        <div className="bg-gray-800/50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p><strong>Timer:</strong> Ao abrir, a cancela fecha automaticamente em {status.tempoRestante || 10}s</p>
          <p><strong>Sensor:</strong> Quando um carro passa, o timer eh resetado</p>
          <p><strong>Modo Definitivo:</strong> Cancela fica aberta sem timer (para eventos especiais)</p>
        </div>
      </div>
    </div>
  )
}
