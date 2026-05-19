'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { C, serif, sans, mono } from '@/components/landing/Gauge'
import { Logo } from '@/components/landing/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'signup') setIsSignUp(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setIsError(true)
      setMessage(error.message)
    } else if (isSignUp) {
      setIsError(false)
      setMessage('Vérifie ton email pour confirmer ton compte.')
    } else {
      router.refresh()
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: C.bg, color: C.ink }}
    >
      <header
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 28px',
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        <Logo />
        <Link
          href="/"
          style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: '0.18em',
            color: C.muteDeep,
            textDecoration: 'none',
          }}
        >
          ← RETOUR
        </Link>
      </header>

      <main className="relative flex-1 flex items-center justify-center" style={{ padding: '48px 24px' }}>
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <div
            className="absolute"
            style={{
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 520,
              height: 380,
              borderRadius: '50%',
              background: `${C.phosphor}12`,
              filter: 'blur(120px)',
            }}
          />
        </div>

        <div
          className="relative w-full"
          style={{
            maxWidth: 440,
            background: C.bgCard,
            border: `1px solid ${C.rule}`,
            borderRadius: 16,
            padding: 36,
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: '0.28em',
                color: C.phosphor,
                marginBottom: 14,
              }}
            >
              § ACCÈS · {isSignUp ? 'CRÉATION' : 'CONNEXION'}
            </div>
            <h1
              style={{
                fontFamily: serif,
                fontSize: 38,
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: C.ink,
                margin: 0,
              }}
            >
              {isSignUp ? (
                <>
                  Ouvrez votre{' '}
                  <span style={{ fontStyle: 'italic', color: C.phosphor }}>édition.</span>
                </>
              ) : (
                <>
                  Reprenez votre{' '}
                  <span style={{ fontStyle: 'italic', color: C.phosphor }}>lecture.</span>
                </>
              )}
            </h1>
            <p
              style={{
                fontFamily: serif,
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.5,
                color: C.inkDim,
                marginTop: 14,
                marginBottom: 0,
              }}
            >
              {isSignUp
                ? '5 analyses gratuites chaque jour, sans carte bancaire.'
                : 'Accédez à vos scores, votre watchlist et l’édition du jour.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 18 }}>
            <Field
              label="EMAIL"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              label="MOT DE PASSE"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
            />

            {message && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${isError ? `${C.sanguine}55` : `${C.phosphor}55`}`,
                  background: `${isError ? C.sanguine : C.phosphor}10`,
                  fontFamily: sans,
                  fontSize: 13,
                  color: isError ? C.sanguine : C.phosphor,
                  lineHeight: 1.45,
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: '14px 18px',
                background: C.phosphor,
                color: C.bg,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 10,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.55 : 1,
                transition: 'opacity 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {loading
                ? 'Patientez…'
                : isSignUp
                ? <>Créer mon compte <span style={{ fontSize: 16 }}>→</span></>
                : <>Se connecter <span style={{ fontSize: 16 }}>→</span></>}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${C.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ fontFamily: sans, fontSize: 13, color: C.muted }}>
              {isSignUp ? 'Déjà un compte ?' : 'Pas encore inscrit ?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }}
              style={{
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                color: C.phosphor,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {isSignUp ? 'Se connecter →' : "S'inscrire →"}
            </button>
          </div>
        </div>
      </main>

      <footer
        style={{
          borderTop: `1px solid ${C.rule}`,
          padding: '20px 28px',
          fontFamily: mono,
          fontSize: 10,
          color: C.muted,
          letterSpacing: '0.14em',
          textAlign: 'center',
        }}
      >
        © 2026 ALPHABRIEF · OUTIL D&apos;AIDE À LA DÉCISION · PAS UN CONSEIL MIF II
      </footer>
    </div>
  )
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  minLength?: number
}) {
  return (
    <label className="flex flex-col" style={{ gap: 8 }}>
      <span
        style={{
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: '0.22em',
          color: C.muted,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: C.bg,
          color: C.ink,
          border: `1px solid ${C.rule}`,
          borderRadius: 10,
          fontFamily: sans,
          fontSize: 15,
          outline: 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = `${C.phosphor}80`
          e.currentTarget.style.boxShadow = `0 0 0 3px ${C.phosphor}1A`
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = C.rule
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
    </label>
  )
}
