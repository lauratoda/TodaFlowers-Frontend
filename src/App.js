import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Pedidos from './components/Pedidos';
import PedidoForm from './components/PedidoForm';
import PedidoDetail from './components/PedidoDetail'; // 1. Importamos el nuevo componente
import MainLayout from './components/MainLayout';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
      <Router>
          <div className="App">
              <Routes>
                  <Route path="/login" element={<Login />} />
                  
                  {/* Ruta para el Dashboard */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <Dashboard />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />

                  {/* Ruta para la lista de Pedidos */}
                  <Route 
                    path="/pedidos" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <Pedidos />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />

                  {/* Ruta para el formulario de nuevo pedido */}
                  <Route 
                    path="/pedidos/nuevo" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <PedidoForm />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />

                  {/* 2. Añadimos la nueva ruta para el detalle del pedido */}
                  <Route 
                    path="/pedidos/:id" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <PedidoDetail />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />

                  {/* La ruta principal ahora redirige al dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
          </div>
      </Router>
  );
}

export default App;


