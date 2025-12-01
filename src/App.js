import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Pedidos from './components/Pedidos';
import PedidoForm from './components/PedidoForm';
import FacturaForm from './components/FacturaForm';
import PedidoDetail from './components/PedidoDetail';
import Clientes from './components/Clientes';
import ClienteForm from './components/ClienteForm'; // 1. Importamos el nuevo componente
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

                  {/* --- RUTAS DE CLIENTES --- */}
                  <Route 
                    path="/clientes" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <Clientes />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />
                  {/* 2. Añadimos la ruta para el formulario de cliente (crear y editar) */}
                  <Route 
                    path="/clientes/nuevo" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <ClienteForm />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/clientes/:id" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <ClienteForm />
                        </MainLayout>
                      </PrivateRoute>
                    } 
                  />

                  {/* --- RUTAS DE PEDIDOS --- */}
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

                  {/* --- RUTAS DE FACTURACIÓN --- */}
                  <Route 
                    path="/facturas/nuevo/:idPedido" 
                    element={
                      <PrivateRoute>
                        <MainLayout>
                          <FacturaForm />
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