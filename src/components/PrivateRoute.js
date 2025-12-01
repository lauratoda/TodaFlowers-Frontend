import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // Si hay un token, muestra el componente hijo (ej: Dashboard). Si no, redirige al login.
    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;