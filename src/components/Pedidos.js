import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Row, Col, ButtonGroup, Card, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PencilFill, TrashFill } from 'react-bootstrap-icons';

const formatDateForAPI = (date) => date.toISOString().split('T')[0];

const getNextDayOfWeek = (dayOfWeek) => {
    const today = new Date();
    const resultDate = new Date(today.getTime());
    resultDate.setDate(today.getDate() + (dayOfWeek - today.getDay() + 7) % 7);
    if (resultDate.getDay() === today.getDay()) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
};

const Pedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate();

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

    useEffect(() => {
        fetchPedidos();
    }, [selectedDate]);

    const handleDeletePedido = async (idPedido) => {
        if (window.confirm('¿Estás ABSOLUTAMENTE SEGURA de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
            try {
                await apiClient.delete(`/pedidos/${idPedido}`);
                fetchPedidos(); 
            } catch (err) {
                setError('No se pudo eliminar el pedido.');
                console.error(err);
            }
        }
    };

    // --- FUNCIÓN PARA OBTENER LA CLASE CSS BASADA EN EL ESTADO ---
    const getRowClass = (estado) => {
        switch (estado) {
            case 'ENTREGADO':
                return 'pedido-entregado';
            case 'REMITIDO':
                return 'pedido-remitido';
            case 'FACTURADO':
                return 'pedido-facturado';
            default:
                return '';
        }
    };

    const renderPedidos = () => {
        if (loading) {
            return <div className="text-center mt-4"><Spinner animation="border" /><p>Cargando pedidos...</p></div>;
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
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map(pedido => {
                        const isEditable = !['ENTREGADO', 'CANCELADO', 'REMITIDO', 'FACTURADO'].includes(pedido.estado);
                        return (
                            <tr
                                key={pedido.idPedido}
                                className={getRowClass(pedido.estado)}
                            >
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.idPedido}</td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.cliente?.nombreFantasia || `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`}</td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.estado}</td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.notas}</td>
                                
                                <td className="text-center">
                                    {isEditable && (
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button 
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => navigate(`/pedidos/editar/${pedido.idPedido}`)}
                                            >
                                                <PencilFill />
                                            </Button>
                                            <Button 
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeletePedido(pedido.idPedido)}
                                            >
                                                <TrashFill />
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        );
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col><h1>Gestión de Pedidos</h1></Col>
                <Col xs="auto"><Button variant="primary" onClick={() => navigate('/pedidos/nuevo')}>Crear Pedido</Button></Col>
            </Row>

            <Card className="p-3 mb-4">
                <Row className="align-items-center">
                    <Col md={4}>
                        <Form.Label>Seleccionar fecha:</Form.Label>
                        <DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} dateFormat="dd/MM/yyyy" className="form-control" />
                    </Col>
                    <Col md={8}>
                        <Form.Label>Accesos rápidos:</Form.Label>
                        <div>
                            <ButtonGroup>
                                <Button variant="outline-secondary" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                                <Button variant="outline-secondary" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); setSelectedDate(d); }}>Mañana</Button>
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

