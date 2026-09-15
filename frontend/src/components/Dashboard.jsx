import { useState, useEffect } from 'react'
import {
  CreditCard,
  LogIn,
  LogOut,
  XCircle,
  DoorOpen,
  DoorClosed,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react'
import { estatisticasTags, estatisticasLogs, topUsuarios, statusCancela } from '../api/api'

function CardEstatistica({ titulo, valor, icone: Icon, cor, subtitulo }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className="text-3xl font-bold mt-1">{valor}</p>
          {subtitulo && (
            <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${cor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [statsTags, setStatsTags] = useState({ total: 0, ativas: 0, inativas: 0 })
  const [statsLogs, setStatsLogs] = useState({ total_acessos: 0, entradas: 0, saidas: 0, negados: 0 })
  const [top, setTop] = useState([])
  const [status, setStatus] = useState({ aberta: false })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      const [tags, logs, topData, statusData] = await Promise.all([
        estatisticasTags(),
        estatisticasLogs(),
        topUsuarios(),
        statusCancela()
      ])
      setStatsTags(tags)
      setStatsLogs(logs)
      setTop(topData)
      setStatus(statusData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setCarregando(false)
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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Visao geral do sistema de controle de acesso</p>
      </div>

      {/* Status da cancela */}
      <div className={`card ${status.aberta ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {status.aberta ? (
              <DoorOpen className="h-10 w-10 text-green-600" />
            ) : (
              <DoorClosed className="h-10 w-10 text-red-600" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                Cancela {status.aberta ? 'Aberta' : 'Fechada'}
              </h3>
              {status.motivo && (
                <p className="text-sm text-gray-500">Motivo: {status.motivo}</p>
              )}
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            status.aberta
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {status.aberta ? 'ABERTA' : 'FECHADA'}
          </div>
        </div>
      </div>

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardEstatistica
          titulo="Total de Tags"
          valor={statsTags.total}
          icone={CreditCard}
          cor="bg-facef-500"
          subtitulo={`${statsTags.ativas} ativas`}
        />
        <CardEstatistica
          titulo="Acessos Hoje"
          valor={statsLogs.total_acessos}
          icone={Activity}
          cor="bg-blue-500"
          subtitulo="ultimas 24h"
        />
        <CardEstatistica
          titulo="Entradas"
          valor={statsLogs.entradas}
          icone={LogIn}
          cor="bg-green-500"
        />
        <CardEstatistica
          titulo="Acessos Negados"
          valor={statsLogs.negados}
          icone={XCircle}
          cor="bg-red-500"
        />
      </div>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top usuarios */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold">Usuarios Mais Ativos</h3>
          </div>

          {top.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum registro ainda</p>
          ) : (
            <div className="space-y-3">
              {top.map((item, index) => (
                <div
                  key={item.tag_codigo}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{item.proprietario || 'Nao identificado'}</p>
                      <p className="text-xs text-gray-400">{item.placa} - {item.departamento}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-facef-500">
                    {item.total_acessos} acessos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold">Resumo do Sistema</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tags ativas</span>
              <span className="font-semibold text-green-600">{statsTags.ativas}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tags inativas</span>
              <span className="font-semibold text-red-600">{statsTags.inativas}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Saidas registradas</span>
              <span className="font-semibold text-blue-600">{statsLogs.saidas}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total de acessos (24h)</span>
              <span className="font-semibold text-facef-500">{statsLogs.total_acessos}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
