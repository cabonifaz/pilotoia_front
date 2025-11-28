import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from "./routes/Router";
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TooltipProvider } from '@/components/shadcn/tooltip'

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RouterProvider router={router} />
      {import.meta.env.VITE_ENVIRONMENT === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </TooltipProvider>
  </QueryClientProvider>
)
