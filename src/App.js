import './App.css';
 import Login from './components/Login';
 import Dashboard from './components/Dashboard';
 import PrivateRoute from './components/PrivateRoute'; // 1. Importamos nuestro guardia
 import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
 
 function App() {
   return (
       <Router>
           <div className="App">
               <Routes>
                   <Route path="/login" element={<Login />} />                  
                   {/* 2. Envolvemos el Dashboard con nuestro PrivateRoute */}
                   <Route 
                     path="/dashboard" 
                     element={
                       <PrivateRoute>
                         <Dashboard />
                       </PrivateRoute>
                     } 
                   />
                   {/* 3. La ruta principal ahora redirige al dashboard si estás logueado, o al login si no */}
                   <Route path="/" element={<Navigate to="/dashboard" />} />
               </Routes>
           </div>
       </Router>
   );
 }
 
 export default App;