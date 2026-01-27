import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import AppRouter from './routes'

function App() {
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

  return (
    <div
      className="min-h-screen"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1d2e 0%, #0f1419 100%)'
          : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <AppRouter />
    </div>
  )
}

export default App
