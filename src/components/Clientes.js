import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import { Search, TrashFill, PencilFill, Receipt } from 'react-bootstrap-icons';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClientes = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await apiClient.get(`/clientes?q=${terminoBusqueda}`);
                setClientes(response.data.content || []);
            } catch (err) {
                setError('No se pudo cargar la lista de clientes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchClientes();
        }, 500);

        return () => clearTimeout(timerId);
    }, [terminoBusqueda]);

    const handleDelete = async (idCliente, e) => {
        e.stopPropagation();
        if (window.confirm('¿Estás segura de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
            try {
                await apiClient.delete(`/clientes/${idCliente}`);
                const response = await apiClient.get(`/clientes?q=${terminoBusqueda}`);
                setClientes(response.data.content || []);
            } catch (err) {
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
                    {/* Este botón ahora será de color #F68E8D gracias al CSS */}
                    <Button variant="primary" onClick={() => navigate('/clientes/nuevo')}>
                        Crear Cliente
                    </Button>
                </Col>
            </Row>

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
                        <th>Contacto</th>
                        <th>Localidad</th>
                        <th className="text-center">Cta. Cte.</th>
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
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/clientes/${cliente.idCliente}`)}>{cliente.whatsapp || cliente.telefono}</td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/clientes/${cliente.idCliente}`)}>{cliente.localidad}</td>
                                
                                <td className="text-center">
                                    {/* --- BOTÓN DE CTA. CTE. AHORA ES SECUNDARIO --- */}
                                    <Button 
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${cliente.idCliente}/cuenta`) }}
                                        title="Ver Estado de Cuenta"
                                    >
                                        <Receipt />
                                    </Button>
                                </td>

                                <td className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                        <Button 
                                            variant="outline-secondary"
                                            className="btn-accion-secundaria"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/clientes/${cliente.idCliente}`) }}
                                            title="Editar Cliente"
                                        >
                                            <PencilFill />
                                        </Button>
                                        <Button 
                                            variant="outline-danger"
                                            className="btn-accion-secundaria"
                                            size="sm"
                                            onClick={(e) => handleDelete(cliente.idCliente, e)}
                                            title="Eliminar Cliente"
                                        >
                                            <TrashFill />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center">No se encontraron clientes.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default Clientes;