const TOKEN_KEY = 'jsf_token'
const SOURCE_KEY = 'jsf_source'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)

export const getRole = () => localStorage.getItem('jsf_role') || 'MEMBER'
export const getSource = () => localStorage.getItem(SOURCE_KEY) || 'PASSWORD'
export const setSession = (token: string, role: string, source: 'PASSWORD' | 'WECHAT' = 'PASSWORD') => {
  setToken(token)
  if (role) localStorage.setItem('jsf_role', role)
  localStorage.setItem(SOURCE_KEY, source)
}
export const clearSession = () => {
  setToken(null)
  localStorage.removeItem('jsf_role')
  localStorage.removeItem(SOURCE_KEY)
}

/** 微信会话过期时静默重授权，而不是把用户丢回账密登录页 */
function unauthorized() {
  setToken(null)
  if (getSource() === 'WECHAT') {
    const redirect = encodeURIComponent(location.pathname + location.search)
    window.location.replace(`/wechat/oauth/entry?redirect=${redirect}`)
  } else {
    window.location.href = '/login'
  }
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch('/api' + path, { ...options, headers })
  let body: any = null
  try { body = await res.json() } catch { /* 非 JSON 响应 */ }
  if (res.status === 401 || body?.code === 401) {
    unauthorized()
    throw new Error('登录已过期')
  }
  if (!body || body.code !== 0) throw new Error(body?.message || '请求失败，请稍后再试')
  return body.data as T
}

/** multipart 上传专用：不能带 Content-Type，交给浏览器生成 boundary */
async function requestForm<T = any>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch('/api' + path, { method: 'POST', body: form, headers })
  let body: any = null
  try { body = await res.json() } catch { /* 非 JSON 响应 */ }
  if (res.status === 401 || body?.code === 401) {
    unauthorized()
    throw new Error('登录已过期')
  }
  // 单张图片被打回时，message 里带具体原因，交给调用方逐张展示
  if (!body || body.code !== 0) throw new Error(body?.message || '上传失败，请稍后再试')
  return body.data as T
}

export const api = {
  // 认证（短信链路已下线：仅账密登录 + 公众号认领）
  loginPassword: (phone: string, password: string) =>
    request<any>('/auth/login/password', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  wechatTicket: (ticket: string) =>
    request<any>('/auth/wechat/ticket', { method: 'POST', body: JSON.stringify({ ticket }) }),
  wechatClaim: (d: { claimTicket: string; phone: string; claimCode: string }) =>
    request<any>('/auth/wechat/claim', { method: 'POST', body: JSON.stringify(d) }),
  // 会员
  home: () => request<any>('/member/home'),
  packages: () => request<any[]>('/member/packages'),
  me: () => request<any>('/member/me'),
  // 教练
  coachDetail: (id: number | string) => request<any>(`/coaches/${id}`),
  slots: (coachId: number | string, date: string, courseId: number | string) =>
    request<any>(`/coaches/${coachId}/slots?date=${date}&courseId=${courseId}`),
  // 预约
  createBooking: (d: any) => request<any>('/bookings', { method: 'POST', body: JSON.stringify(d) }),
  myBookings: (tab?: string) => request<any[]>(`/bookings/my${tab ? '?tab=' + tab : ''}`),
  cancelBooking: (id: number, reason?: string) =>
    request<void>(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: reason || '' }) }),

  /* ===== 课程模板 ===== */
  courses: () => request<any[]>('/courses'),
  createCourse: (d: any) => request<any>('/courses', { method: 'POST', body: JSON.stringify(d) }),
  updateCourse: (id: number, d: any) => request<void>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  toggleCourse: (id: number) => request<void>(`/courses/${id}/toggle`, { method: 'POST' }),

  /* ===== 会员管理 ===== */
  updateMember: (id: number, d: any) =>
    request<void>(`/admin/members/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  claimCode: (id: number) => request<any>(`/admin/wechat/members/${id}/claim-code`),
  resetClaimCode: (id: number) =>
    request<any>(`/admin/wechat/members/${id}/claim-code`, { method: 'POST' }),
  wechatBindInfo: (id: number) => request<any>(`/admin/wechat/members/${id}/bind`),
  unbindWechat: (id: number) =>
    request<void>(`/admin/wechat/members/${id}/bind`, { method: 'DELETE' }),
  claimRequests: (status = 'PENDING') =>
    request<any[]>(`/admin/wechat/claim-requests?status=${status}`),
  bindClaimRequest: (id: number, d: { memberId: number; note?: string }) =>
    request<void>(`/admin/wechat/claim-requests/${id}/bind`, { method: 'POST', body: JSON.stringify(d) }),
  rejectClaimRequest: (id: number, note?: string) =>
    request<void>(`/admin/wechat/claim-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
  notifyLogs: (scene?: string) =>
    request<any[]>(`/admin/wechat/notify-logs${scene ? `?scene=${scene}` : ''}`),
  adminMembers: (keyword?: string, coachId?: number) =>
    request<any[]>(`/admin/members${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}${coachId ? (keyword ? '&' : '?') + 'coachId=' + coachId : ''}`),
  createMember: (d: any) => request<any>('/admin/members', { method: 'POST', body: JSON.stringify(d) }),
  memberDetail: (id: number) => request<any>(`/admin/members/${id}`),
  rebindCoach: (id: number, coachId: number, remark?: string) =>
    request<void>(`/admin/members/${id}/coach`, { method: 'PUT', body: JSON.stringify({ coachId, remark }) }),
  addPackage: (id: number, d: any) => request<any>(`/admin/members/${id}/packages`, { method: 'POST', body: JSON.stringify(d) }),
  adjustPackage: (pid: number, delta: number, remark?: string) =>
    request<void>(`/admin/members/packages/${pid}/adjust`, { method: 'POST', body: JSON.stringify({ delta, remark }) }),
  adminPackages: (keyword?: string) =>
    request<any[]>(`/admin/packages${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),

  /* ===== 教练管理 ===== */
  coachMe: () => request<any>('/coaches/me'),
  adminCoaches: () => request<any[]>('/admin/coaches'),
  createCoach: (d: any) => request<any>('/admin/coaches', { method: 'POST', body: JSON.stringify(d) }),
  coachQualifications: (id: number) => request<any[]>(`/coaches/${id}/qualifications`),
  addQualification: (id: number, d: any) => request<any>(`/coaches/${id}/qualifications`, { method: 'POST', body: JSON.stringify(d) }),

  /* ===== 请假 ===== */
  coachLeaves: (id: number) => request<any[]>(`/coaches/${id}/leaves`),
  createLeave: (id: number, d: any) => request<any>(`/coaches/${id}/leaves`, { method: 'POST', body: JSON.stringify(d) }),
  leaveConflict: (id: number, start: string, end: string) =>
    request<any[]>(`/coaches/${id}/leave-conflict?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`),

  /* ===== 预约（管理端） ===== */
  adminBookings: (q: Record<string, any> = {}) => {
    const p = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.append(k, String(v)) })
    return request<any[]>(`/admin/bookings${p.toString() ? '?' + p : ''}`)
  },
  staffCancelBooking: (id: number, reason?: string) =>
    request<void>(`/admin/bookings/${id}`, { method: 'DELETE', body: JSON.stringify({ reason: reason || '' }) }),
  manualCheckIn: (id: number) => request<void>(`/admin/bookings/${id}/manual-checkin`, { method: 'POST' }),

  /* ===== 报表 / 工作台 ===== */
  dashboard: () => request<any>('/admin/dashboard'),
  reportFinance: () => request<any>('/reports/finance'),
  reportCourses: () => request<any>('/reports/courses'),

  /* ===== 会员风采 ===== */
  momentConfig: () => request<any>('/moments/config'),
  momentQuota: () => request<any>('/moments/quota'),
  // 一张一张上传：一次请求一张图，后端对应一次腾讯云图片审核；失败只影响这一张
  uploadMoment: (file: Blob, title: string, batchId: string) => {
    const f = new FormData()
    f.append('file', file)
    if (title) f.append('title', title)
    if (batchId) f.append('batchId', batchId)
    return requestForm<any>('/moments/images', f)
  },
  moments: (scope = 'all', page = 1, size = 20) =>
    request<any>(`/moments?scope=${scope}&page=${page}&size=${size}`),
  momentDetail: (id: number | string) => request<any>(`/moments/${id}`),
  momentComments: (id: number | string, page = 1, size = 20) =>
    request<any>(`/moments/${id}/comments?page=${page}&size=${size}`),
  addMomentComment: (id: number | string, d: any) =>
    request<any>(`/moments/${id}/comments`, { method: 'POST', body: JSON.stringify(d) }),
  deleteMoment: (id: number | string) => request<void>(`/moments/${id}`, { method: 'DELETE' }),
  deleteMomentComment: (cid: number | string) =>
    request<void>(`/moments/comments/${cid}`, { method: 'DELETE' }),
  adminMoments: (status = 'PENDING', page = 1, size = 50) =>
    request<any>(`/admin/moments?status=${status}&page=${page}&size=${size}`),
  reviewMoment: (id: number | string, action: string, reason?: string) =>
    request<void>(`/admin/moments/${id}/review`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
  batchReviewMoments: (ids: number[], action: string, reason?: string) =>
    request<any>('/admin/moments/batch-review', { method: 'POST', body: JSON.stringify({ ids, action, reason }) })
}
