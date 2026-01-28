import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

interface AppRouterProps {
  isDarkMode: boolean
}

const AppRouter = ({ isDarkMode }: AppRouterProps) => {
  return (
    <Routes>
      <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
