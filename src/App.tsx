import { useState, useEffect } from 'react'
import Navbar from './components/common/Navbar'
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

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  return (
    <div
      className="min-h-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <AppRouter isDarkMode={isDarkMode} />
    </div>
  )
}

export default App
