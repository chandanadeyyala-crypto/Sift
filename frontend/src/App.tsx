import { Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Upload from '@/pages/Upload'
import Questions from '@/pages/Questions'
import Report from '@/pages/Report'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/questions/:sessionId" element={<Questions />} />
      <Route path="/report/:sessionId" element={<Report />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
