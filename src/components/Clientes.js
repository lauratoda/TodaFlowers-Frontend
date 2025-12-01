import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                // El backend soporta paginación, por ahora pedimos la primera página por defecto.
                const response = await apiClient.get('/clientes');
                // Para respuestas paginadas con Spring, los datos suelen estar en el campo 'content'.
                setClientes(response.data.content || []); 
            } catch (err) {
                setError('No se pudo cargar la lista de clientes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, []);

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Cargando clientes...</p>
            </Container>
        );
    }

    if (error) {
        return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>Gestión de Clientes</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => navigate('/clientes/nuevo')}>
                        Crear Cliente
                    </Button>
                </Col>
            </Row>
            
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre / Razón Social</th>
                        <th>Contacto (Tel/WhatsApp)</th>
                        <th>Localidad</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.length > 0 ? (
                        clientes.map(cliente => (
                            <tr key={cliente.idCliente} onClick={() => navigate(`/clientes/${cliente.idCliente}`)} style={{ cursor: 'pointer' }}>
                                <td>{cliente.nombreFantasia || `${cliente.nombre || ''} ${cliente.apellido || ''}`}</td>
                                <td>{cliente.whatsapp || cliente.telefono}</td>
                                <td>{cliente.localidad}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="text-center">No se encontraron clientes.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default Clientes;
