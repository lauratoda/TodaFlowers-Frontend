import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Row, Col, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CheckCircleFill } from 'react-bootstrap-icons';

// Función segura para formatear fecha local (YYYY-MM-DD)
const formatDateForAPI = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Helper para obtener el color de fondo (variant) según el estado
const getEstadoVariant = (estado) => {
    switch (estado) {
        case 'PENDIENTE':
            return 'secondary'; // Gris
        case 'EN_PREPARACION':
        case 'PREPARADO_INCOMPLETO':
            return 'info';      // Celeste
        case 'PREPARADO_COMPLETO':
        case 'LISTO_PARA_DESPACHO':
            return 'primary';   // Azul
        case 'REMITIDO':
            return 'warning';   // Amarillo
        case 'FACTURADO':
            return 'success';   // Verde
        case 'CANCELADO':
            return 'danger';    // Rojo
        default:
            return 'light';
    }
};

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            const formattedDate = formatDateForAPI(selectedDate);

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
                                        summary.pedidosParaHoy.map(pedido => {
                                            const variant = getEstadoVariant(pedido.estado);
                                            // Ajustamos el color del texto para asegurar contraste
                                            const textColor = ['warning', 'info', 'light'].includes(variant) ? 'text-dark' : 'text-white';
                                            
                                            return (
                                                <ListGroup.Item
                                                    key={pedido.idPedido}
                                                    action
                                                    onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}
                                                    style={{ cursor: 'pointer' }}
                                                    variant={variant} // Aplicamos el color a toda la fila
                                                    className={`d-flex justify-content-between align-items-center ${textColor}`}
                                                >
                                                    <div className="ms-2 me-auto">
                                                        <div className="fw-bold">
                                                            {pedido.cliente.nombreFantasia || `${pedido.cliente.nombre} ${pedido.cliente.apellido}`}
                                                        </div>
                                                        {pedido.notas && <small className={textColor === 'text-white' ? 'text-white-50' : 'text-muted'}>{pedido.notas}</small>}
                                                    </div>
                                                    
                                                    <div className="text-end">
                                                        <span className="d-block small fw-bold">
                                                            {pedido.estado.replace(/_/g, ' ')}
                                                        </span>
                                                        {pedido.entregado && (
                                                            <Badge bg="light" text="success" pill className="mt-1">
                                                                <CheckCircleFill /> Entregado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </ListGroup.Item>
                                            );
                                        })
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
