import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Spinner, Alert, Button, Row, Col, ButtonGroup, Card, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PencilFill, TrashFill, CheckCircleFill, Search } from 'react-bootstrap-icons';

// --- Funciones de Utilidad ---

const formatDateForAPI = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// ✅ NUEVA FUNCIÓN: Formatea la fecha para mostrarla en la tabla
const formatDisplayDate = (apiDate) => {
    if (!apiDate) return 'N/A';
    const parts = apiDate.split('-');
    if (parts.length !== 3) return apiDate; // Devuelve original si el formato es inesperado
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};

const getNextDayOfWeek = (dayOfWeek) => {
    const today = new Date();
    const resultDate = new Date(today.getTime());
    resultDate.setDate(today.getDate() + (dayOfWeek - today.getDay() + 7) % 7);
    if (resultDate.getDay() === today.getDay() && (dayOfWeek - today.getDay() + 7) % 7 === 0) {
        resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
};

// --- Constantes ---

const ESTADOS_PEDIDO = [
    'PENDIENTE', 'EN_PREPARACION', 'PREPARADO_COMPLETO', 'PREPARADO_INCOMPLETO',
    'LISTO_PARA_DESPACHO', 'REMITIDO', 'FACTURADO', 'CANCELADO'
];

const Pedidos = () => {
    const navigate = useNavigate();

    // --- Estados del Componente ---
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para filtros
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedEstado, setSelectedEstado] = useState('');

    // --- Lógica de Fetching y Filtros ---

    // Hook para el debounce del input de búsqueda
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms de delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const fetchPedidos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Construcción dinámica de parámetros para la API
            const params = new URLSearchParams();

            if (selectedDate) {
                params.append('fechaEntrega', formatDateForAPI(selectedDate));
            }
            if (debouncedSearchTerm) {
                params.append('cliente', debouncedSearchTerm);
            }
            if (selectedEstado) {
                params.append('estado', selectedEstado);
            }

            // Solo hacemos la llamada si hay al menos un filtro
            if (params.toString()) {
                const response = await apiClient.get(`/pedidos?${params.toString()}`);
                setPedidos(response.data);
            } else {
                setPedidos([]); // Si no hay filtros, no mostramos nada
            }

        } catch (err) {
            setError('No se pudo cargar la lista de pedidos con los filtros aplicados.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, debouncedSearchTerm, selectedEstado]);

    // Efecto principal que re-dispara el fetch cuando cambian los filtros
    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedEstado('');
        setSelectedDate(new Date()); // Volvemos a la fecha de hoy por defecto
    };

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

    const getRowClass = (pedido) => {
        if (pedido.entregado) return 'pedido-entregado';
        switch (pedido.estado) {
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
            return <Alert variant="info" className="mt-4">No se encontraron pedidos para los filtros seleccionados. Pruebe con otros criterios.</Alert>;
        }
        return (
            <Table striped bordered hover responsive className="mt-4">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha Entrega</th> {/* ✅ NUEVA COLUMNA */}
                        <th>Estado</th>
                        <th className="text-center">Entregado</th>
                        <th>Notas</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map(pedido => {
                        const isCancelado = pedido.estado === 'CANCELADO';
                        const isFacturado = pedido.estado === 'FACTURADO';
                        const isRemitido = pedido.estado === 'REMITIDO';
                        const puedeEditar = !isCancelado && !isFacturado && !isRemitido && !pedido.entregado;

                        return (
                            <tr
                                key={pedido.idPedido}
                                className={getRowClass(pedido)}
                            >
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.idPedido}</td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>
                                    {pedido.nombreCliente}
                                </td>
                                {/* ✅ NUEVA CELDA CON LA FECHA FORMATEADA */}
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>
                                    {formatDisplayDate(pedido.fechaEntrega)}
                                </td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.estado}</td>
                                <td className="text-center align-middle">
                                    {pedido.entregado && <CheckCircleFill className="text-success" />}
                                </td>
                                <td style={{ cursor: 'pointer' }} onClick={() => navigate(`/pedidos/${pedido.idPedido}`)}>{pedido.notas}</td>
                                <td className="text-center">
                                    {puedeEditar && (
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
                <Row className="g-3 align-items-end">
                    <Col md={4}>
                        <Form.Label>Fecha de Entrega</Form.Label>
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            isClearable // Permite limpiar la fecha
                            placeholderText="Buscar en todas las fechas..."
                        />
                    </Col>
                    <Col md={5}>
                        <Form.Label>Buscar por Cliente</Form.Label>
                        <InputGroup>
                            <InputGroup.Text><Search /></InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Nombre, apellido o fantasía..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={3}>
                        <Form.Label>Estado del Pedido</Form.Label>
                        <Form.Select
                            value={selectedEstado}
                            onChange={(e) => setSelectedEstado(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {ESTADOS_PEDIDO.map(estado => (
                                <option key={estado} value={estado}>{estado}</option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col className="d-flex justify-content-between align-items-center">
                        <div>
                            <ButtonGroup>
                                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); setSelectedDate(d); }}>Mañana</Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedDate(getNextDayOfWeek(3))}>Próx. Mié</Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedDate(getNextDayOfWeek(4))}>Próx. Jue</Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setSelectedDate(getNextDayOfWeek(5))}>Próx. Vie</Button>
                            </ButtonGroup>
                        </div>
                        <Button variant="link" onClick={handleClearFilters}>
                            Limpiar todos los filtros
                        </Button>
                    </Col>
                </Row>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            {renderPedidos()}
        </Container>
    );
};

export default Pedidos;
