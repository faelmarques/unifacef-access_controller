import { useState, useEffect } from 'react'
import {
  DoorOpen,
  DoorClosed,
  Clock,
  Car,
  User,
  Timer,
  Lock,
  Unlock,
  LogOut,
  Loader2,
  MapPin
} from 'lucide-react'
import { loginPortaria } from '../api/api'
import toast from 'react-hot-toast'

const API_URL = '/api'

// Icone de cancela (barreira)
function GateOpen({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 6v12M20 6v12M4 12h16M7 6V4h2v2M15 6V4h2v2" />
      <path d="M7 12v6M17 12v6" strokeDasharray="2 2" />
    </svg>
  )
}

function GateClosed({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 6v12M20 6v12M4 12h16M7 6V4h2v2M15 6V4h2v2" />
      <path d="M7 12v6M17 12v6" />
    </svg>
  )
}

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function traduzirTipo(tipo) {
  const traducoes = {
    ABERTURA: { texto: 'Abertura Manual', cor: 'bg-green-500' },
    ABERTURA_RFID: { texto: 'Abertura RFID', cor: 'bg-blue-500' },
    FECHAMENTO: { texto: 'Fechamento Manual', cor: 'bg-red-500' },
    FECHAMENTO_AUTOMATICO: { texto: 'Fechamento Auto', cor: 'bg-orange-500' },
    ABERTURA_DEFINITIVA: { texto: 'Modo Definitivo', cor: 'bg-purple-500' },
    DESATIVAR_DEFINITIVO: { texto: 'Desativar Definitivo', cor: 'bg-gray-500' },
    ACESSO_NEGADO: { texto: 'Acesso Negado', cor: 'bg-red-600' }
  }
  return traducoes[tipo] || { texto: tipo, cor: 'bg-gray-500' }
}

export default function Portaria() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [tokenPortaria, setTokenPortaria] = useState(null)
  const [status, setStatus] = useState({
    aberta: false,
    modoDefinitivo: false,
    timerAtivo: false,
    tempoRestante: 0,
    sensorCarro: false,
    nomeLocal: null
  })
  const [ultimosAcessos, setUltimosAcessos] = useState([])
  const [operando, setOperando] = useState(false)
  const [erro, setErro] = useState('')
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [carregando, setCarregando] = useState(false)

  // Atualizar relogio
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Carregar dados quando autenticado
  useEffect(() => {
    if (autenticado && tokenPortaria) {
      carregarDados()
      const intervalo = setInterval(carregarDados, 2000)
      return () => clearInterval(intervalo)
    }
  }, [autenticado, tokenPortaria])

  async function carregarDados() {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenPortaria}`
      }

      const localId = usuarioLogado?.local_id || 1

      const [statusRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/gate/portaria/status`, { headers }),
        fetch(`${API_URL}/logs/ultimos?local_id=${localId}`, { headers })
      ])

      const statusData = await statusRes.json()
      const logsData = await logsRes.json()

      setStatus(statusData || { aberta: false, modoDefinitivo: false, timerAtivo: false, tempoRestante: 0, sensorCarro: false, nomeLocal: null })
      setUltimosAcessos(Array.isArray(logsData) ? logsData : [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const dados = await loginPortaria(usuario, senha)
      localStorage.setItem('token_portaria', dados.token)
      localStorage.setItem('usuario_portaria', JSON.stringify(dados.usuario))
      setTokenPortaria(dados.token)
      setUsuarioLogado(dados.usuario)
      setAutenticado(true)
      toast.success(`Bem-vindo, ${dados.usuario.nome}!`)
    } catch (err) {
      setErro(err.message || 'Credenciais invalidas')
      setSenha('')
    } finally {
      setCarregando(false)
    }
  }

  async function abrirCancela() {
    setOperando(true)
    try {
      await fetch(`${API_URL}/gate/portaria/abrir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenPortaria}`
        },
        body: JSON.stringify({ motivo: 'Abertura Manual' })
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenPortaria}`
        }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenPortaria}`
        },
        body: JSON.stringify({ ativar: !status.modoDefinitivo })
      })
      await carregarDados()
    } catch (err) {
      console.error('Erro ao alterar modo definitivo:', err)
    } finally {
      setOperando(false)
    }
  }

  function logout() {
    localStorage.removeItem('token_portaria')
    localStorage.removeItem('usuario_portaria')
    setAutenticado(false)
    setUsuarioLogado(null)
    setTokenPortaria(null)
    setUsuario('')
    setSenha('')
  }

  // Tela de login
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-block bg-white p-3 rounded-2xl mb-4">
              <img src="/logo-facef.png" alt="FACEF" className="h-16" />
            </div>
            <p className="text-gray-400 mt-2">Controle de Portaria</p>
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-white text-center mb-6">Entrar na Portaria</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Usuario</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 text-white border-0 rounded-xl p-3 focus:ring-2 focus:ring-facef-500 outline-none"
                  placeholder="Seu usuario"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value)
                    setErro('')
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Senha</label>
                <input
                  type="password"
                  className="w-full bg-gray-700 text-white border-0 rounded-xl p-3 focus:ring-2 focus:ring-facef-500 outline-none"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setErro('')
                  }}
                />
              </div>

              {erro && (
                <p className="text-red-400 text-center text-sm">{erro}</p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-facef-500 hover:bg-facef-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar'
                )}
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
            <div className="bg-white p-1 rounded-lg">
              <img src="/logo-facef.png" alt="FACEF" className="h-8" />
            </div>
            {status.nomeLocal && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>{status.nomeLocal}</span>
              </div>
            )}
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{usuarioLogado?.nome}</span>
              <button
                onClick={logout}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
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
            <GateOpen className="h-20 w-20 mx-auto mb-4" />
          ) : (
            <GateClosed className="h-20 w-20 mx-auto mb-4" />
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
            <GateOpen className="h-12 w-12" />
            ABRIR
          </button>

          <button
            onClick={fecharCancela}
            disabled={operando || !status.aberta || status.modoDefinitivo}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-8 rounded-2xl text-2xl transition-colors flex flex-col items-center gap-2"
          >
            <GateClosed className="h-12 w-12" />
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
              {ultimosAcessos.map((acesso) => {
                const tipoInfo = traduzirTipo(acesso.tipo)
                return (
                  <div
                    key={acesso.id}
                    className="bg-gray-700 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`${tipoInfo.cor} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {tipoInfo.texto}
                      </span>
                      <div>
                        {acesso.proprietario && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{acesso.proprietario}</span>
                          </div>
                        )}
                        {acesso.placa && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Car className="h-3 w-3" />
                            <span className="font-mono">{acesso.placa}</span>
                            {acesso.veiculo && <span>- {acesso.veiculo}</span>}
                          </div>
                        )}
                        {acesso.observacao && !acesso.proprietario && (
                          <p className="text-sm text-gray-400">{acesso.observacao}</p>
                        )}
                        {acesso.operador && (
                          <p className="text-xs text-gray-500 mt-1">Operador: {acesso.operador}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-400">
                      {formatarData(acesso.criado_em)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Instrucoes */}
        <div className="bg-gray-800/50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p><strong>Timer:</strong> Ao abrir, a cancela fecha automaticamente em 10s</p>
          <p><strong>Sensor:</strong> Quando um carro passa, o timer eh resetado</p>
          <p><strong>Modo Definitivo:</strong> Cancela fica aberta sem timer (para eventos especiais)</p>
        </div>
      </div>
    </div>
  )
}
