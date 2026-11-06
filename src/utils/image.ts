export interface PrecompressResult {
  blob: Blob
  sourceBytes: number
  outputBytes: number
  sourceWidth: number
  sourceHeight: number
  width: number
  height: number
}

/** 前端预压缩：等比缩到长边 1920 并转 JPEG，减少上行流量；后端仍会完整重做校验与压缩 */
export async function precompressImage(file: File, maxEdge = 1920, quality = 0.82): Promise<PrecompressResult> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('图片无法解码，请换一张（HEIC 请用系统相册转存为 JPG）'))
      el.src = url
    })
    const sw = img.naturalWidth || img.width
    const sh = img.naturalHeight || img.height
    if (!sw || !sh) throw new Error('图片尺寸无效')

    const ratio = Math.min(1, maxEdge / Math.max(sw, sh))
    const w = Math.max(1, Math.round(sw * ratio))
    const h = Math.max(1, Math.round(sh * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('浏览器不支持图片处理')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('图片转换失败')), 'image/jpeg', quality)
    })
    return {
      blob,
      sourceBytes: file.size,
      outputBytes: blob.size,
      sourceWidth: sw,
      sourceHeight: sh,
      width: w,
      height: h
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function formatBytes(n: number): string {
  if (!n || n < 0) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

export function newBatchId(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
