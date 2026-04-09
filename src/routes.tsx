import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

interface AppRouterProps {
  isDarkMode: boolean
}

export const FORM_SG_URL = 'https://www.form.gov.sg/635f32c5001b2d0011fff09b'
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
