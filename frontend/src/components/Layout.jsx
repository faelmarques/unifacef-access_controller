import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  ScrollText,
  DoorOpen,
  MapPin,
  Wifi,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tags', label: 'Tags RFID', icon: CreditCard },
  { path: '/logs', label: 'Historico', icon: ScrollText },
  { path: '/controle', label: 'Controle Cancela', icon: DoorOpen },
  { path: '/locais', label: 'Locais', icon: MapPin },
  { path: '/dispositivos', label: 'Dispositivos', icon: Wifi },
  { path: '/operadores', label: 'Operadores Portaria', icon: Users },
]

export default function Layout({ children }) {
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-facef-900 text-white p-4 flex items-center justify-between">
        <div className="bg-white p-1 rounded-lg">
          <img src="/logo-facef.png" alt="FACEF" className="h-8" />
        </div>
        <button
          onClick={() => setSidebarAberta(!sidebarAberta)}
          className="p-2 hover:bg-facef-800 rounded-lg"
        >
          {sidebarAberta ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-0 z-40
            w-64 bg-facef-900 text-white
            transform transition-transform duration-200 ease-in-out
            lg:transform-none
            ${sidebarAberta ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Logo */}
          <div className="p-6 border-b border-facef-800">
            <div className="bg-white p-2 rounded-lg inline-block">
              <img src="/logo-facef.png" alt="FACEF" className="h-10" />
            </div>
          </div>

          {/* Menu */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const ativo = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarAberta(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-150
                    ${ativo
                      ? 'bg-facef-500 text-white'
                      : 'text-facef-200 hover:bg-facef-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Usuario */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-facef-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-facef-700 p-2 rounded-full">
                  <span className="text-sm font-medium">
                    {usuario.nome?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium truncate max-w-[120px]">{usuario.nome}</p>
                  <p className="text-xs text-facef-300 truncate max-w-[120px]">{usuario.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-facef-300 hover:text-white hover:bg-facef-800 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarAberta && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarAberta(false)}
          />
        )}

        {/* Conteudo principal */}
        <main className="flex-1 min-h-screen lg:ml-0">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
