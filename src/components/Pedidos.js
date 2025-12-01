import React, { useState, useEffect } from 'react';
// 1. AÑADIMOS Card y Form a la lista de importaciones
import { Container, Table, Spinner, Alert, Button, Row, Col, ButtonGroup, Card, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// --- Helpers para manejar fechas ---

// Formatea una fecha al formato que el backend espera (YYYY-MM-DD)
const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
};

// Obtiene la fecha del próximo día de la semana que le pidas (1=Lunes, ..., 7=Domingo)
const getNextDayOfWeek = (dayOfWeek) => {
    const today = new Date();
    const resultDate = new Date(today.getTime());
    // Calcula los días hasta el próximo día de la semana deseado
    resultDate.setDate(today.getDate() + (dayOfWeek - today.getDay() + 7) % 7);
    // Si el día calculado es hoy, salta a la semana siguiente
    if (resultDate.getDay() === today.getDay()) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
};

// --- Componente Principal ---

const Pedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date()); // Por defecto, la fecha de hoy
    const navigate = useNavigate();

    // Este efecto se ejecuta cada vez que 'selectedDate' cambia
    useEffect(() => {
        const fetchPedidos = async () => {
            setLoading(true);
            setError('');
            try {
                const formattedDate = formatDateForAPI(selectedDate);
                const response = await apiClient.get(`/pedidos?fechaEntrega=${formattedDate}`);
                setPedidos(response.data);
            } catch (err) {
                setError('No se pudo cargar la lista de pedidos para la fecha seleccionada.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPedidos();
    }, [selectedDate]);

    const renderPedidos = () => {
        if (loading) {
            return (
                <div className="text-center mt-4">
                    <Spinner animation="border" />
                    <p>Cargando pedidos...</p>
                </div>
            );
        }

        if (pedidos.length === 0) {
            return <Alert variant="info" className="mt-4">No se encontraron pedidos para esta fecha.</Alert>;
        }

        return (
            <Table striped bordered hover responsive className="mt-4">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Notas</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map(pedido => (
                        <tr key={pedido.idPedido} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)} style={{ cursor: 'pointer' }}>
                            <td>{pedido.idPedido}</td>
                            <td>{pedido.cliente?.nombreFantasia || `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`}</td>
                            <td>{pedido.estado}</td>
                            <td>{pedido.notas}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>Gestión de Pedidos</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={() => navigate('/pedidos/nuevo')}>
                        Crear Pedido
                    </Button>
                </Col>
            </Row>

            {/* Panel de Filtros de Fecha */}
            <Card className="p-3 mb-4">
                <Row className="align-items-center">
                    <Col md={4}>
                        <Form.Label>Seleccionar fecha:</Form.Label>
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                        />
                    </Col>
                    <Col md={8}>
                        <Form.Label>Accesos rápidos:</Form.Label>
                        <div>
                            <ButtonGroup>
                                <Button variant="outline-secondary" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                                <Button variant="outline-secondary" onClick={() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    setSelectedDate(tomorrow);
                                }}>Mañana</Button>
                                <Button variant="outline-secondary" onClick={() => setSelectedDate(getNextDayOfWeek(3))}>Próx. Miércoles</Button>
                                <Button variant="outline-secondary" onClick={() => setSelectedDate(getNextDayOfWeek(4))}>Próx. Jueves</Button>
                                <Button variant="outline-secondary" onClick={() => setSelectedDate(getNextDayOfWeek(5))}>Próx. Viernes</Button>
                            </ButtonGroup>
                        </div>
                    </Col>
                </Row>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            {renderPedidos()}
        </Container>
    );
};

export default Pedidos;




