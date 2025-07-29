'use client'

import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export const CurrentUserAvatar = () => {
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  
  // Function to format the display name with fading effect
  const formatDisplayName = (name: string) => {
    if (!name || name === '?') {
      return name?.charAt(0)?.toUpperCase() || '?'
    }
    
    if (name.length <= 8) {
      return name
    }
    
    // For names 8+ characters, show up to 10 chars with last 2 fading
    const truncated = name.substring(0, 10)
    const mainPart = truncated.substring(0, 8)
    const fadingPart = truncated.substring(8)
    
    return (
      <>
        {mainPart}
        <span className="opacity-40">{fadingPart}</span>
      </>
    )
  }

  const initials = name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <Link href="/dashboard/profile" className="cursor-pointer">
      <Avatar className="border border-primary bg-white hover:border-primary/80 transition-colors w-auto h-9 px-3 rounded-full min-w-9">
        {profileImage && <AvatarImage src={profileImage} alt={initials} />}
        <AvatarFallback className="text-sm font-medium">
          {formatDisplayName(name || '?')}
        </AvatarFallback>
      </Avatar>
    </Link>
  )
}
