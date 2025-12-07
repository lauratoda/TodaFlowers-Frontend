import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Row, Col, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';

const EstadoCuenta = () => {
    const { id } = useParams(); // Obtenemos el ID del cliente de la URL
    const navigate = useNavigate();

    // Estados para los datos y la UI
    const [cliente, setCliente] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEstadoCuenta = async () => {
            setLoading(true);
            try {
                // Hacemos la llamada a un endpoint que construiremos después en el backend
                const response = await apiClient.get(`/clientes/${id}/estado-cuenta`);
                setCliente(response.data.cliente);
                setMovimientos(response.data.movimientos);
            } catch (err) {
                setError('No se pudo cargar el estado de cuenta del cliente.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEstadoCuenta();
    }, [id]);

    // Función para obtener el saldo final del último movimiento
    const getSaldoFinal = () => {
        if (movimientos.length === 0) {
            return 0;
        }
        return movimientos[movimientos.length - 1].saldo;
    };

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Cargando estado de cuenta...</p>
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
                    <h1>Estado de Cuenta</h1>
                    {cliente && <h2>{cliente.nombreFantasia || `${cliente.nombre} ${cliente.apellido}`}</h2>}
                </Col>
                <Col xs="auto">
                    <Button variant="secondary" onClick={() => navigate('/clientes')}>Volver a Clientes</Button>
                </Col>
            </Row>

            <Card className="mb-4 text-center">
                <Card.Body>
                    <Card.Title>Saldo Actual</Card.Title>
                    <Card.Text as="h2" className={getSaldoFinal() >= 0 ? 'text-success' : 'text-danger'}>
                        ${getSaldoFinal().toFixed(2)}
                    </Card.Text>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Número</th>
                        <th className="text-end">Debe</th>
                        <th className="text-end">Haber</th>
                        <th className="text-end">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientos.length > 0 ? (
                        movimientos.map((mov, index) => (
                            <tr key={index}>
                                <td>{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                                <td>{mov.tipoDocumento}</td>
                                <td>{mov.numeroDocumento}</td>
                                <td className="text-end text-danger">{mov.debe > 0 ? `$${mov.debe.toFixed(2)}` : '-'}</td>
                                <td className="text-end text-success">{mov.haber > 0 ? `$${mov.haber.toFixed(2)}` : '-'}</td>
                                <td className="text-end"><strong>${mov.saldo.toFixed(2)}</strong></td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No hay movimientos para mostrar.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default EstadoCuenta;