import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const NavigationBar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // 1. Borramos el token del almacenamiento
        localStorage.removeItem('token');
        // 2. Redirigimos al usuario a la página de login
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/dashboard">TodaFlowers</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                        <Nav.Link as={Link} to="/clientes">Clientes</Nav.Link>
                        <Nav.Link as={Link} to="/pedidos">Pedidos</Nav.Link>
                        {/* Aquí añadiremos más links en el futuro (Pedidos, Clientes, etc.) */}
                    </Nav>
                    <Nav>
                        <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
