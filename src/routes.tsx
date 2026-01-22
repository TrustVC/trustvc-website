import { Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Navigate to="/" replace/>} />
    </Routes>
  )
}

export default AppRouter
