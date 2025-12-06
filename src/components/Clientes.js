import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Row, Col, Form, InputGroup } from 'react-bootstrap'; // Añadimos Form, InputGroup
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import { Search, TrashFill } from 'react-bootstrap-icons'; // Importamos iconos

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [terminoBusqueda, setTerminoBusqueda] = useState(''); // Estado para la búsqueda
    const navigate = useNavigate();

    // El efecto ahora depende del término de búsqueda
    useEffect(() => {
        const fetchClientes = async () => {
            setLoading(true);
            setError('');
            try {
                // Pasamos el término de búsqueda como un parámetro 'q'
                const response = await apiClient.get(`/clientes?q=${terminoBusqueda}`);
                setClientes(response.data.content || []);
            } catch (err) {
                setError('No se pudo cargar la lista de clientes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        // Usamos un temporizador para no hacer una llamada a la API en cada tecla presionada
        const timerId = setTimeout(() => {
            fetchClientes();
        }, 500); // Espera 500ms después de que el usuario deja de escribir

        return () => clearTimeout(timerId); // Limpia el temporizador si el componente se desmonta
    }, [terminoBusqueda]);

    const handleDelete = async (idCliente) => {
        if (window.confirm('¿Estás segura de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
            try {
                await apiClient.delete(`/clientes/${idCliente}`);
                // Refrescamos la lista para que el cliente eliminado desaparezca
                setTerminoBusqueda(prev => prev); // Esto es un truco para forzar la re-ejecución del useEffect
                // Una forma más limpia sería llamar a fetchClientes() directamente, pero esto funciona bien.
                const response = await apiClient.get(`/clientes?q=${terminoBusqueda}`);
                setClientes(response.data.content || []);

            } catch (err) {
                // Mostramos el error específico que viene del backend
                setError(err.response?.data?.message || 'No se pudo eliminar el cliente.');
                console.error(err);
            }
        }
    };

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Cargando clientes...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col><h1>Gestión de Clientes</h1></Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => navigate('/clientes/nuevo')}>
                        Crear Cliente
                    </Button>
                </Col>
            </Row>

            {/* --- BARRA DE BÚSQUEDA --- */}
            <Row className="mb-3">
                <Col>
                    <InputGroup>
                        <InputGroup.Text><Search /></InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Buscar por nombre, CUIT, teléfono..."
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre / Razón Social</th>
                        <th>Contacto (Tel/WhatsApp)</th>
                        <th>Localidad</th>
                        {/* --- NUEVA COLUMNA DE ACCIONES --- */}
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.length > 0 ? (
                        clientes.map(cliente => (
                            <tr key={cliente.idCliente}>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/clientes/${cliente.idCliente}`)}>
                                    {cliente.nombreFantasia || `${cliente.nombre || ''} ${cliente.apellido || ''}`}
                                </td>
                                <td>{cliente.whatsapp || cliente.telefono}</td>
                                <td>{cliente.localidad}</td>
                                <td className="text-center">
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.idCliente)}>
                                        <TrashFill />
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center">No se encontraron clientes.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default Clientes;