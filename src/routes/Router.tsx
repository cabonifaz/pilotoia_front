import { createHashRouter } from 'react-router-dom';
import { LoginPage } from '../pages/login/Login';
import { App } from '../App';
import { GuardRoute } from './GuardRoute';
import ProtectedLayout from '../components/layout/ProtectedLayout';
import StreamingChat from '../pages/rag/StreamingChat';
import DocumentUpload from '../pages/upload/DocumentUpload';
import CompanyManagement from '../pages/company/CompanyManagement';
import AreaManagement from '../pages/area/AreaManagement';
import UsersManagement from '../pages/users/UsersManagement';
import AgentsManagement from '../pages/agents/AgentsManagement';
import AiManagement from '../pages/ai_models/AiManagement';


export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        element: (
          <GuardRoute>
            <ProtectedLayout />
          </GuardRoute>
        ),
        children: [
          {
            path: 'rag',
            element: <StreamingChat />,
          },
          {
            path: 'upload',
            element: <DocumentUpload />,
          },
          {
            path: 'company',
            element: <CompanyManagement />,
          },
          {
            path: 'areas',
            element: <AreaManagement />,
          },
          {
            path: 'users',
            element: <UsersManagement />,
          },
          {
            path: 'agents',
            element: <AgentsManagement />,
          },
          {
            path: 'ai-models',
            element: <AiManagement />,
          },
          {
            path: 'unauthorized',
            element: (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h1>403 - Acceso denegado</h1>
                <p>No tienes permiso para acceder a esta página.</p>
              </div>
            ),
          },
          {
            path: '*',
            element: (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h1>404 - Página no encontrada</h1>
                <p>La página que buscas no existe.</p>
              </div>
            ),
          },
        ],
      },
    ],
  },
]);