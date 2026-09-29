import { useRef, useState, type FormEvent } from 'react'

import { validateTicket } from '../services/catalog-api'

type TicketCheckInProps = { token: string }

type CheckInResult = {
  status: 'ACTIVE' | 'USED' | 'CANCELLED'
  usedAt: string | null
}

type BarcodeDetectorConstructor = new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }

export function TicketCheckIn({ token }: TicketCheckInProps) {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setResult(null)

    try {
      const ticket = await validateTicket(token, code)
      setResult(ticket)
      setMessage('Entrada liberada. O ingresso foi marcado como utilizado.')
      setCode('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível validar o ingresso.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const scanWithCamera = async () => {
    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setMessage('A leitura por câmera não é compatível com este navegador. Digite o código do ingresso.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsScanning(true)
      const detector = new Detector({ formats: ['qr_code'] })
      const timer = window.setInterval(async () => {
        if (!videoRef.current) return
        const codes = await detector.detect(videoRef.current)
        if (!codes[0]?.rawValue) return
        setCode(codes[0].rawValue)
        stream.getTracks().forEach((track) => track.stop())
        window.clearInterval(timer)
        setIsScanning(false)
      }, 500)
    } catch {
      setMessage('Não foi possível acessar a câmera. Verifique a permissão ou digite o código.')
    }
  }

  return <section className="admin-workspace">
    <form className="admin-form" onSubmit={(event) => void submit(event)}>
      <div><p className="eyebrow">Portaria</p><h3>Validar entrada</h3></div>
      <p className="admin-form-hint">Use o leitor de QR Code para preencher o campo ou digite o código exibido no ingresso.</p>
      <label>Código do ingresso<input required autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ex.: DEMO-..." /></label>
      <button className="secondary-action" type="button" disabled={isScanning} onClick={() => void scanWithCamera()}>{isScanning ? 'Lendo QR Code...' : 'Ler QR pela câmera'}</button>
      <video className={isScanning ? 'qr-preview visible' : 'qr-preview'} ref={videoRef} muted playsInline aria-label="Prévia da câmera para leitura do QR Code" />
      <button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Validando...' : 'Validar ingresso'}</button>
      {message && <p className={result ? 'reservation-message success' : 'reservation-message'} role="status">{message}</p>}
    </form>
    <section className="admin-list" aria-label="Resultado da validação"><h3>Resultado</h3>{result ? <article><strong>Ingresso utilizado</strong><span>Check-in confirmado {result.usedAt ? `em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(result.usedAt))}` : 'agora'}.</span></article> : <p className="empty-state">Aguarde a leitura ou digite um código para validar a entrada.</p>}</section>
  </section>
}
