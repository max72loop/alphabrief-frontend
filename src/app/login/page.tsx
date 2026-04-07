'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
      <div className="bg-[#13131f] border border-white/[0.07] p-8 rounded-xl w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-base font-bold tracking-tight text-white mb-1">
            Alpha<span className="text-indigo-400">Brief</span>
          </p>
          <h1 className="text-2xl font-bold text-white">
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-indigo-500 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-indigo-500 outline-none"
            required
            minLength={6}
          />
          {message && (
            <p className={`text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : isSignUp ? "S'inscrire" : 'Se connecter'}
          </button>
        </form>
        <p className="text-zinc-500 text-sm text-center mt-4">
          {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
            className="text-indigo-400 hover:underline"
          >
            {isSignUp ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  )
}
