import axios from 'axios';

// 1. Creamos una instancia de axios con la URL base de nuestro backend
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// 2. Creamos un "interceptor" que se ejecutará antes de cada petición
apiClient.interceptors.request.use(
    (config) => {
        // 3. Buscamos el token en el almacenamiento local
        const token = localStorage.getItem('token');
        
        // 4. Si el token existe, lo añadimos a la cabecera de la petición
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        // En caso de un error en la configuración de la petición
        return Promise.reject(error);
    }
);

export default apiClient;
