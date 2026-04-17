import { useState, useEffect } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import AppRouter from './routes'

type BackgroundRouteRule = {
  paths: string[]
  lightClass: string
  darkClass: string
}

const BACKGROUND_ROUTE_RULES: BackgroundRouteRule[] = [
  {
    paths: ['/news-updates', '/news-updates/:slug'],
    lightClass: 'app-shell--news-light',
    darkClass: 'app-shell--news-dark',
  },
]

function App() {
  const location = useLocation()
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode')
      return saved ? JSON.parse(saved) === true : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  const matchedBackgroundRule = BACKGROUND_ROUTE_RULES.find(rule =>
    rule.paths.some(path => Boolean(matchPath(path, location.pathname)))
  )

  const backgroundClassName = matchedBackgroundRule
    ? isDarkMode
      ? matchedBackgroundRule.darkClass
      : matchedBackgroundRule.lightClass
    : isDarkMode
      ? 'app-shell--bg-dark'
      : 'app-shell--bg-light'

  const appShellClassName = `app-shell ${backgroundClassName}`

  return (
    <div className={appShellClassName}>
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <AppRouter isDarkMode={isDarkMode} />
    </div>
  )
}

export default App
