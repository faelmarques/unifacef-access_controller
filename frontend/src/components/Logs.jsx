import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  LogIn,
  LogOut,
  XCircle,
  Download,
  Loader2,
  Calendar
} from 'lucide-react'
import { buscarLogs } from '../api/api'
import toast from 'react-hot-toast'

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function BadgeTipo({ tipo }) {
  const estilos = {
    ENTRADA: 'bg-green-100 text-green-700',
    SAIDA: 'bg-blue-100 text-blue-700',
    NEGADO: 'bg-red-100 text-red-700'
  }

  const icones = {
    ENTRADA: LogIn,
    SAIDA: LogOut,
    NEGADO: XCircle
  }

  const Icon = icones[tipo] || XCircle

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${estilos[tipo] || 'bg-gray-100 text-gray-700'}`}>
      <Icon className="h-3 w-3" />
      {tipo}
    </span>
  )
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    data_inicio: '',
    data_fim: ''
  })

  useEffect(() => {
    carregarLogs()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarLogs()
    }, 300)
    return () => clearTimeout(timer)
  }, [filtros])

  async function carregarLogs() {
    setCarregando(true)
    try {
      const params = {}
      if (filtros.busca) params.tag = filtros.busca
      if (filtros.tipo) params.tipo = filtros.tipo
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
      if (filtros.data_fim) params.data_fim = filtros.data_fim

      const dados = await buscarLogs(params)
      setLogs(dados)
    } catch (err) {
      toast.error('Erro ao carregar historico')
    } finally {
      setCarregando(false)
    }
  }

  function exportarCSV() {
    if (logs.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }

    const headers = ['Data/Hora', 'Tag', 'Proprietario', 'Placa', 'Tipo', 'Dispositivo', 'Observacao']
    const rows = logs.map(log => [
      formatarData(log.criado_em),
      log.tag_codigo,
      log.proprietario || '',
      log.placa || '',
      log.tipo,
      log.dispositivo || '',
      log.observacao || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `acessos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Arquivo exportado com sucesso')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historico de Acessos</h1>
          <p className="text-gray-500">Consulte todos os registros de entrada e saida</p>
        </div>
        <button onClick={exportarCSV} className="btn-secondary">
          <Download className="h-5 w-5" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="font-medium text-gray-700">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Tag ou proprietario..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saidas</option>
              <option value="NEGADO">Negados</option>
            </select>
          </div>

          <div>
            <label className="label">Data Inicio</label>
            <input
              type="date"
              className="input"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Data Fim</label>
            <input
              type="date"
              className="input"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="card">
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-facef-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data/Hora</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tag</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Proprietario</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Placa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dispositivo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Observacao</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatarData(log.criado_em)}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{log.tag_codigo}</td>
                    <td className="py-3 px-4">{log.proprietario || '-'}</td>
                    <td className="py-3 px-4 font-mono text-sm">{log.placa || '-'}</td>
                    <td className="py-3 px-4">
                      <BadgeTipo tipo={log.tipo} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.dispositivo || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {log.observacao || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && logs.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Exibindo {logs.length} registros
          </div>
        )}
      </div>
    </div>
  )
}
