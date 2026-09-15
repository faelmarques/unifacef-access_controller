const API_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders(incluirAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (incluirAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function tratarResposta(res) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sessao expirada');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.erro || 'Erro na requisicao');
  }

  return data;
}

// Auth
export async function login(email, senha) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ email, senha })
  });
  return tratarResposta(res);
}

export async function verificarToken() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

// Tags
export async function buscarTags(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/tags?${params}`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function buscarTag(id) {
  const res = await fetch(`${API_URL}/tags/${id}`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function criarTag(dados) {
  const res = await fetch(`${API_URL}/tags`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function atualizarTag(id, dados) {
  const res = await fetch(`${API_URL}/tags/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function desativarTag(id) {
  const res = await fetch(`${API_URL}/tags/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function reativarTag(id) {
  const res = await fetch(`${API_URL}/tags/${id}/reativar`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function estatisticasTags() {
  const res = await fetch(`${API_URL}/tags/stats/geral`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

// Logs
export async function buscarLogs(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`${API_URL}/logs?${params}`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function estatisticasLogs() {
  const res = await fetch(`${API_URL}/logs/stats`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function acessosPorHora() {
  const res = await fetch(`${API_URL}/logs/stats/por-hora`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function topUsuarios() {
  const res = await fetch(`${API_URL}/logs/stats/top-usuarios`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

// Controle da cancela
export async function abrirCancela(motivo) {
  const res = await fetch(`${API_URL}/gate/abrir`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ motivo })
  });
  return tratarResposta(res);
}

export async function fecharCancela() {
  const res = await fetch(`${API_URL}/gate/fechar`, {
    method: 'POST',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function statusCancela() {
  const res = await fetch(`${API_URL}/gate/status`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

// Dispositivos
export async function buscarDispositivos() {
  const res = await fetch(`${API_URL}/dispositivos`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function criarDispositivo(dados) {
  const res = await fetch(`${API_URL}/dispositivos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function deletarDispositivo(id) {
  const res = await fetch(`${API_URL}/dispositivos/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

// Usuarios da Portaria
export async function buscarUsuariosPortaria() {
  const res = await fetch(`${API_URL}/usuarios-portaria`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function criarUsuarioPortaria(dados) {
  const res = await fetch(`${API_URL}/usuarios-portaria`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function atualizarUsuarioPortaria(id, dados) {
  const res = await fetch(`${API_URL}/usuarios-portaria/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function desativarUsuarioPortaria(id) {
  const res = await fetch(`${API_URL}/usuarios-portaria/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function reativarUsuarioPortaria(id) {
  const res = await fetch(`${API_URL}/usuarios-portaria/${id}/reativar`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function loginPortaria(usuario, senha) {
  const res = await fetch(`${API_URL}/usuarios-portaria/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha })
  });
  return tratarResposta(res);
}

// Locais
export async function buscarLocais() {
  const res = await fetch(`${API_URL}/locais`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function buscarLocaisAtivos() {
  const res = await fetch(`${API_URL}/locais/ativos/lista`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function criarLocal(dados) {
  const res = await fetch(`${API_URL}/locais`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function atualizarLocal(id, dados) {
  const res = await fetch(`${API_URL}/locais/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return tratarResposta(res);
}

export async function desativarLocal(id) {
  const res = await fetch(`${API_URL}/locais/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function reativarLocal(id) {
  const res = await fetch(`${API_URL}/locais/${id}/reativar`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return tratarResposta(res);
}

// Status cancela por local
export async function statusCancelaLocal(localId) {
  const res = await fetch(`${API_URL}/gate/status/${localId}`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}

export async function statusGeral() {
  const res = await fetch(`${API_URL}/gate/status-geral`, {
    headers: getHeaders()
  });
  return tratarResposta(res);
}
