'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-sm bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors"
    >
      Déconnexion
    </button>
  )
}
