import { createContext, useContext } from 'react'
import { useUnreadMessages } from '../hooks/useUnreadMessages'

const Ctx = createContext({ unread: 0, markRead: () => {} })

export function UnreadMessagesProvider({ children }) {
  const value = useUnreadMessages()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useUnreadCount = () => useContext(Ctx)
