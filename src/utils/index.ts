/** 轻提示 */
export function toast(msg: string) {
  const div = document.createElement('div')
  div.className = 'toast'
  div.textContent = msg
  document.body.appendChild(div)
  setTimeout(() => div.classList.add('show'), 10)
  setTimeout(() => {
    div.classList.remove('show')
    setTimeout(() => div.remove(), 300)
  }, 2200)
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 未来 n 天的日期条数据 */
export function nextDays(n: number) {
  const list: { label: string; day: string; date: string }[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    list.push({ label: i === 0 ? '今天' : WEEK[d.getDay()], day: String(d.getDate()), date })
  }
  return list
}

/** "2026-12-01 14:00:00" -> { date, time, end, week } */
export function parseBookingTime(start: string, end: string) {
  const d = new Date(start.replace(/-/g, '/'))
  const date = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    date,
    week: WEEK[d.getDay()],
    time: start.slice(11, 16),
    end: end.slice(11, 16)
  }
}

/** 距离目标时间的人性化描述 */
export function timeUntil(start: string) {
  const ms = new Date(start.replace(/-/g, '/')).getTime() - Date.now()
  if (ms <= 0) return '进行中'
  const h = Math.floor(ms / 3600000)
  if (h >= 24) return `还剩 ${Math.floor(h / 24)} 天`
  if (h >= 1) return `约 ${h} 小时后`
  return `${Math.max(1, Math.floor(ms / 60000))} 分钟后`
}

export const BOOKING_STATUS: Record<string, { text: string; cls: string }> = {
  BOOKED: { text: '待上课', cls: 'wait' },
  CHECKED_IN: { text: '已签到', cls: 'info' },
  COMPLETED: { text: '已完成', cls: 'done' },
  CANCELED: { text: '已取消', cls: 'cancel' }
}

export function slotLabel(status: string) {
  return { BOOKED: '已被约', MINE: '我的预约', LEAVE: '请假', PAST: '已过时间' }[status] || ''
}
