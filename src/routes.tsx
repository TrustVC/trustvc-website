import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import NewsRouteFallback from './components/common/NewsRouteFallback'

const News = lazy(() => import('./pages/News'))
const NewsDetail = lazy(() => import('./pages/NewsDetail'))

interface AppRouterProps {
  isDarkMode: boolean
}

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
      <Route path="/contact" element={<Contact isDarkMode={isDarkMode} />} />
      <Route path="*" element={<NotFound isDarkMode={isDarkMode} />} />
    </Routes>
  )
}

export default AppRouter
