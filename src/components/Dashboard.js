import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Row, Col, ListGroup } from 'react-bootstrap';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            const formattedDate = selectedDate.toISOString().split('T')[0];

            try {
                const response = await apiClient.get(`/dashboard/summary?fecha=${formattedDate}`);
                setSummary(response.data);
            } catch (err) {
                setError('No se pudo cargar la información del dashboard para la fecha seleccionada.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedDate]);

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>Dashboard</h1>
                </Col>
                <Col md="auto">
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="dd/MM/yyyy"
                        className="form-control"
                    />
                </Col>
            </Row>

            {loading ? (
                <Spinner animation="border" />
            ) : (
                summary && (
                    <Row>
                        {/* Columna Izquierda: Pedidos y Recordatorios */}
                        <Col md={7}>
                            <Card className="mb-4">
                                <Card.Header>Pedidos para Hoy ({summary.pedidosParaHoy.length})</Card.Header>
                                <ListGroup variant="flush">
                                    {summary.pedidosParaHoy.length > 0 ? (
                                        summary.pedidosParaHoy.map(pedido => (
                                            <ListGroup.Item key={pedido.idPedido}>
                                                <strong>{pedido.cliente.nombreFantasia || `${pedido.cliente.nombre} ${pedido.cliente.apellido}`}</strong>
                                                <p className="mb-0 text-muted">{pedido.notas}</p>
                                            </ListGroup.Item>
                                        ))
                                    ) : (
                                        <ListGroup.Item>No hay pedidos para entregar hoy.</ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Card>

                            <Card>
                                <Card.Header>Recordatorios de Hoy ({summary.recordatoriosDeHoy.length})</Card.Header>
                                <ListGroup variant="flush">
                                    {summary.recordatoriosDeHoy.length > 0 ? (
                                        summary.recordatoriosDeHoy.map(recordatorio => (
                                            <ListGroup.Item key={recordatorio.idRecordatorio}>
                                                {recordatorio.descripcion}
                                            </ListGroup.Item>
                                        ))
                                    ) : (
                                        <ListGroup.Item>No hay recordatorios para hoy.</ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Card>
                        </Col>

                        {/* Columna Derecha: Caja Diaria */}
                        <Col md={5}>
                            <Card>
                                <Card.Header>Resumen de Caja del Día ({selectedDate.toLocaleDateString()})</Card.Header>
                                <Card.Body>
                                    <p>Ventas de Mostrador (Efectivo): ${summary.cajaDiaria.ventasMostradorEfectivo}</p>
                                    <p>Cobros Cta. Cte. (Banco): ${summary.cajaDiaria.cobrosCtaCteBanco}</p>
                                    <p>Gastos (Efectivo): ${summary.cajaDiaria.gastosEfectivo}</p>
                                    <hr />
                                    <h4>Saldo de Caja (Efectivo): ${summary.cajaDiaria.saldoCajaEfectivo}</h4>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )
            )}
        </Container>
    );
};

export default Dashboard;