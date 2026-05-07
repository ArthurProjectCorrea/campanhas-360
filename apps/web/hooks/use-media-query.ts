import * as React from 'react'

export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query],
  )

  const getSnapshot = () => {
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => {
    return false
  }

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
