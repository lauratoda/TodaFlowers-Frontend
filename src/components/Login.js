import React, { useState } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. Importamos la herramienta para navegar

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // 2. Preparamos la herramienta de navegación

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                email: email,
                password: password
            });

            // 3. Guardamos el token en el almacenamiento local del navegador
            const token = response.data.token;
            localStorage.setItem('token', token);

            console.log('Login exitoso. Token guardado:', token);

            // 4. Redirigimos al usuario al dashboard
            navigate('/dashboard');

        } catch (error) {
            console.error('Error en el login:', error);
            alert('Error: Email o contraseña incorrectos.');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '25rem' }}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Iniciar Sesión</Card.Title>
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Ingresa tu email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button variant="primary" type="submit">
                                Ingresar
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;
