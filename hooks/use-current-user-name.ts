import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const { data, error } = await createClient().auth.getSession()
      if (error) {
        console.error(error)
      }

      const email = data.session?.user.email
      const displayName = email?.split('@')[0] || '?'
      setName(displayName)
    }

    fetchProfileName()
  }, [])

  return name || '?'
}