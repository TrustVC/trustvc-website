import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

interface AppRouterProps {
  isDarkMode: boolean
}

const AppRouter = ({ isDarkMode }: AppRouterProps) => {
  return (
    <Routes>
      <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
      <Route path="/contact" element={<Contact isDarkMode={isDarkMode} />} />
      <Route path="*" element={<NotFound isDarkMode={isDarkMode} />} />
    </Routes>
  )
}

export default AppRouter
