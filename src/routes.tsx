import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Contact from './pages/Contact'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Partners from './pages/Partners'
import About from './pages/About'
import NewsRouteFallback from './components/common/NewsRouteFallback'

const News = lazy(() => import('./pages/News'))
const NewsDetail = lazy(() => import('./pages/NewsDetail'))
const Toolkit = lazy(() => import('./pages/Toolkit'))

interface AppRouterProps {
  isDarkMode: boolean
}

export const FORM_SG_URL = 'https://www.form.gov.sg/635f32c5001b2d0011fff09b'
const AppRouter = ({ isDarkMode }: AppRouterProps) => {
  return (
    <Routes>
      <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
      <Route
        path="/news-updates"
        element={
          <Suspense fallback={<NewsRouteFallback isDarkMode={isDarkMode} />}>
            <News isDarkMode={isDarkMode} />
          </Suspense>
        }
      />
      <Route
        path="/news-updates/:slug"
        element={
          <Suspense fallback={<NewsRouteFallback isDarkMode={isDarkMode} />}>
            <NewsDetail isDarkMode={isDarkMode} />
          </Suspense>
        }
      />
      <Route path="/partners" element={<Partners isDarkMode={isDarkMode} />} />
      <Route path="/about" element={<About isDarkMode={isDarkMode} />} />
      <Route path="/settings" element={<Settings isDarkMode={isDarkMode} />} />
      <Route path="/contact" element={<Contact isDarkMode={isDarkMode} />} />
      <Route
        path="/toolkit"
        element={
          <Suspense fallback={null}>
            <Toolkit />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound isDarkMode={isDarkMode} />} />
    </Routes>
  )
}

export default AppRouter
