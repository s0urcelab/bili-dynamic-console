import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FullPageSpinner } from '@/components/states'
import { queryClient } from '@/lib/query-client'
import { PublicLayout } from '@/layouts/public-layout'
import { ExplorePage } from '@/pages/explore'
import { NotFoundPage } from '@/pages/not-found'
import { UpPage } from '@/pages/up'
import { UpsPage } from '@/pages/ups'
import { VideoPage } from '@/pages/video'

const LoginPage = lazy(() => import('@/pages/login').then((m) => ({ default: m.LoginPage })))
const AdminLayout = lazy(() => import('@/layouts/admin-layout').then((m) => ({ default: m.AdminLayout })))
const DashboardPage = lazy(() => import('@/pages/admin/dashboard').then((m) => ({ default: m.DashboardPage })))
const VideosPage = lazy(() => import('@/pages/admin/videos').then((m) => ({ default: m.VideosPage })))
const TasksPage = lazy(() => import('@/pages/admin/tasks').then((m) => ({ default: m.TasksPage })))
const SettingsPage = lazy(() => import('@/pages/admin/settings').then((m) => ({ default: m.SettingsPage })))

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<ExplorePage />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="ups" element={<UpsPage />} />
                  <Route path="u/:uid" element={<UpPage />} />
                  <Route path="v/:vid" element={<VideoPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
                <Route path="login" element={<LoginPage />} />
                <Route path="manage" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="videos" element={<VideosPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
