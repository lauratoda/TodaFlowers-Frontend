import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Row, Col, Form, Table, Button, Modal, InputGroup, ButtonGroup, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import { CheckCircleFill } from 'react-bootstrap-icons';

const initialAdelantoState = {
    monto: '',
    metodoPago: 'Efectivo',
    detalle: ''
};

// ✅ 1. Función para parsear fecha string (YYYY-MM-DD) a Date local sin offset de UTC
const parseDateFromAPI = (dateString) => {
    if (!dateString) return null;
    // Dividimos el string para evitar que el navegador lo interprete como UTC
    const parts = dateString.split('-');
    if (parts.length !== 3) return null; // Formato inválido
    const [year, month, day] = parts.map(Number);
    // new Date(year, monthIndex, day) crea la fecha en la zona horaria local del navegador.
    return new Date(year, month - 1, day);
};


const PedidoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showAdelantoModal, setShowAdelantoModal] = useState(false);
    const [adelanto, setAdelanto] = useState(initialAdelantoState);

    const fetchPedidoDetail = async () => {
        try {
            const response = await apiClient.get(`/pedidos/${id}`);
            setPedido(response.data);
            setError(''); 
        } catch (err) {
            setError('No se pudo cargar el detalle del pedido.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchPedidoDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAction = async (action, confirmMessage, successMessage, errorMessage) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
            return;
        }
        try {
            await action();
            if (successMessage) alert(successMessage);
            setLoading(true);
            fetchPedidoDetail();
        } catch (err) {
            setError(err.response?.data?.message || errorMessage);
            console.error(err);
        }
    };

    const handleRegistrarAdelanto = async (e) => {
        e.preventDefault();
        if (!adelanto.monto || adelanto.monto <= 0) {
            alert('Por favor, ingresa un monto válido.');
            return;
        }
        try {
            await apiClient.post(`/pedidos/${id}/adelanto`, adelanto);
            setShowAdelantoModal(false);
            setAdelanto(initialAdelantoState);
            setLoading(true);
            fetchPedidoDetail();
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo registrar el adelanto.');
            console.error(err);
        }
    };
    
    const handleToggleEntregado = () => handleAction(
        () => apiClient.put(`/pedidos/${id}/entregar`),
        `¿Estás segura de que quieres marcar este pedido como ${pedido.entregado ? 'NO ENTREGADO' : 'ENTREGADO'}?`,
        null,
        'No se pudo actualizar el estado de entrega.'
    );

    const handleRemitirPedido = () => handleAction(
        () => apiClient.post(`/pedidos/${id}/remitir`),
        '¿Estás segura de que quieres generar un remito para este pedido?',
        '¡Remito creado con éxito!',
        'No se pudo generar el remito.'
    );

    const handleFacturarPedido = () => navigate(`/facturas/nuevo?idPedido=${id}`);

    const handleDeletePedido = () => handleAction(
        () => apiClient.delete(`/pedidos/${id}`),
        '¿Estás ABSOLUTAMENTE SEGURA de que quieres eliminar este pedido? Esta acción no se puede deshacer.',
        null,
        'No se pudo eliminar el pedido.'
    ).then(() => navigate('/pedidos'));

    const handleChecklistItemUpdate = async (idPedidoItem, field, value) => {
        const currentItem = pedido.items.find(i => i.idPedidoItem === idPedidoItem);
        if (!currentItem) return;

        const updatePayload = {
            separado: field === 'separado' ? value : currentItem.separado,
            notasItem: field === 'notasItem' ? value : currentItem.notasItem,
        };

        const originalPedido = { ...pedido };
        const updatedItems = pedido.items.map(item =>
            item.idPedidoItem === idPedidoItem ? { ...item, [field]: value } : item
        );
        setPedido({ ...pedido, items: updatedItems });

        try {
            await apiClient.put(`/pedidos/items/${idPedidoItem}/checklist`, updatePayload);
            fetchPedidoDetail();
        } catch (err) {
            setError('No se pudo actualizar el item.');
            setPedido(originalPedido);
            console.error(err);
        }
    };

    const handleShowEditModal = (item) => {
        setEditingItem({ ...item });
        setShowEditModal(true);
    };

    const handleDeleteItem = async (idPedidoItem) => {
        if (window.confirm('¿Segura que quieres eliminar este ítem del pedido?')) {
            try {
                await apiClient.delete(`/pedidos/items/${idPedidoItem}`);
                fetchPedidoDetail();
            } catch (err) {
                setError(err.response?.data?.message || 'No se pudo eliminar el ítem.');
                console.error(err);
            }
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            const requestBody = {
                productoDescripcion: editingItem.productoDescripcion,
                especificacion: editingItem.especificacion,
                cantidadPedida: parseInt(editingItem.cantidadPedida),
                precioUnitario: editingItem.precioUnitario ? parseFloat(editingItem.precioUnitario) : null
            };
            await apiClient.put(`/pedidos/items/${editingItem.idPedidoItem}`, requestBody);
            setShowEditModal(false);
            setEditingItem(null);
            fetchPedidoDetail();
        } catch (err) {
            console.error("Error al actualizar el ítem", err);
        }
    };
    
    const calcularTotalPedido = () => {
        if (!pedido || !pedido.items) return 0;
        return pedido.items.reduce((total, item) => {
            const precio = parseFloat(item.precioUnitario) || 0;
            const cantidad = parseInt(item.cantidadPedida) || 0;
            return total + (precio * cantidad);
        }, 0);
    };

    const calcularTotalAdelantos = () => {
        if (!pedido || !pedido.adelantos) return 0;
        return pedido.adelantos.reduce((total, adelanto) => total + adelanto.importe, 0);
    };

    if (loading) {
        return <Container className="mt-4 text-center"><Spinner animation="border" /><p>Cargando detalle...</p></Container>;
    }

    if (!pedido) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">No se encontró el pedido o hubo un error al cargarlo.</Alert>
                <Button variant="secondary" onClick={() => navigate('/pedidos')}>Volver a la Lista</Button>
            </Container>
        );
    }

    const totalPedido = calcularTotalPedido();
    const totalAdelantos = calcularTotalAdelantos();
    const saldoPendiente = totalPedido - totalAdelantos;

    const isCancelado = pedido.estado === 'CANCELADO';
    const isFacturado = pedido.estado === 'FACTURADO';
    const isRemitido = pedido.estado === 'REMITIDO';
    const puedeEditar = !isCancelado && !isFacturado && !isRemitido && !pedido.entregado;
    const puedeRemitir = pedido.estado === 'LISTO_PARA_DESPACHO';
    const puedeFacturar = pedido.estado === 'LISTO_PARA_DESPACHO' || isRemitido;

    return (
        <Container className="mt-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="align-items-center mb-4">
                <Col><h1>Detalle del Pedido #{pedido.idPedido}</h1></Col>
                <Col xs="auto" className="d-flex flex-wrap justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate('/pedidos')}>Volver</Button>
                    {puedeEditar && <Button variant="outline-primary" onClick={() => setShowAdelantoModal(true)}>Registrar Seña</Button>}
                    {puedeEditar && <Button variant="primary" onClick={() => navigate(`/pedidos/editar/${id}`)}>Editar Pedido</Button>}
                    {puedeRemitir && <Button variant="warning" onClick={handleRemitirPedido}>Remitir</Button>}
                    {puedeFacturar && <Button variant="info" onClick={handleFacturarPedido}>Facturar</Button>}
                    {!isCancelado && <Button variant={pedido.entregado ? "outline-success" : "success"} onClick={handleToggleEntregado}>{pedido.entregado ? "Marcar como NO Entregado" : "Marcar como Entregado"}</Button>}
                    {puedeEditar && <Button variant="danger" onClick={handleDeletePedido}>Eliminar</Button>}
                </Col>
            </Row>
            
            <Row>
                <Col md={8}>
                    <Card className="mb-4">
                        <Card.Header>Información General</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <p><strong>Cliente:</strong> {pedido.cliente?.nombreFantasia || `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`}</p>
                                    {/* ✅ 2. Usamos la función para mostrar la fecha de entrega */}
                                    <p><strong>Fecha de Entrega:</strong> {parseDateFromAPI(pedido.fechaEntrega)?.toLocaleDateString('es-AR') || 'N/A'}</p>
                                </Col>
                                <Col md={6}>
                                    <p><strong>Estado:</strong> {pedido.estado}</p>
                                    <p><strong>Entrega:</strong> 
                                        {pedido.entregado 
                                            ? <span className="text-success"><CheckCircleFill /> Entregado</span> 
                                            : <span className="text-muted">Pendiente de Entrega</span>
                                        }
                                    </p>
                                </Col>
                            </Row>
                            {pedido.notas && <><hr /><p><strong>Notas:</strong> {pedido.notas}</p></>}
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>Checklist de Items</Card.Header>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>OK</th><th>Cant.</th><th>Detalle</th><th>Especificación</th><th>Precio Unit.</th><th>Subtotal</th><th>Observaciones</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedido.items.map(item => (
                                    <tr key={item.idPedidoItem} className={item.separado ? 'table-success' : ''}>
                                        <td className="text-center align-middle"><Form.Check type="checkbox" checked={item.separado} onChange={(e) => handleChecklistItemUpdate(item.idPedidoItem, 'separado', e.target.checked)} disabled={!puedeEditar} /></td>
                                        <td className="align-middle">{item.cantidadPedida}</td>
                                        <td className="align-middle">{item.productoDescripcion}</td>
                                        <td className="align-middle">{item.especificacion}</td>
                                        <td className="align-middle text-end">${(item.precioUnitario || 0).toFixed(2)}</td>
                                        <td className="align-middle text-end">${((item.precioUnitario || 0) * item.cantidadPedida).toFixed(2)}</td>
                                        <td><Form.Control type="text" placeholder="Obs." value={item.notasItem || ''} onChange={(e) => handleChecklistItemUpdate(item.idPedidoItem, 'notasItem', e.target.value)} size="sm" disabled={!puedeEditar} /></td>
                                        <td className="text-center align-middle">
                                            {puedeEditar && (
                                                <ButtonGroup size="sm">
                                                    <Button variant="outline-primary" onClick={() => handleShowEditModal(item)}>Editar</Button>
                                                    <Button variant="outline-danger" onClick={() => handleDeleteItem(item.idPedidoItem)}>X</Button>
                                                </ButtonGroup>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card>
                        <Card.Header>Resumen Financiero</Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between">
                                <span>Total Pedido:</span>
                                <strong>${totalPedido.toFixed(2)}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Total Señado:</span>
                                <strong className="text-success">-${totalAdelantos.toFixed(2)}</strong>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between h4">
                                <span>Saldo Pendiente:</span>
                                <strong>${saldoPendiente.toFixed(2)}</strong>
                            </div>
                        </Card.Body>
                        {pedido.adelantos && pedido.adelantos.length > 0 && (
                            <>
                                <Card.Header>Adelantos Recibidos</Card.Header>
                                <ListGroup variant="flush">
                                    {pedido.adelantos.map(p => (
                                        <ListGroup.Item key={p.idPago} className="d-flex justify-content-between align-items-center">
                                            {/* ✅ 3. Usamos la función también para la fecha del adelanto */}
                                            <span>{parseDateFromAPI(p.fecha)?.toLocaleDateString('es-AR') || 'N/A'} - {p.tipoPago}</span>
                                            <strong>${p.importe.toFixed(2)}</strong>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Modales (se mantienen igual) */}
            <Modal show={showAdelantoModal} onHide={() => setShowAdelantoModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Registrar Seña / Adelanto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleRegistrarAdelanto}>
                        <Form.Group className="mb-3">
                            <Form.Label>Monto</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>$</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    placeholder="0.00"
                                    value={adelanto.monto}
                                    onChange={(e) => setAdelanto({ ...adelanto, monto: e.target.value })}
                                    step="0.01"
                                    min="0"
                                    required
                                    autoFocus
                                />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Método de Pago</Form.Label>
                            <Form.Select
                                value={adelanto.metodoPago}
                                onChange={(e) => setAdelanto({ ...adelanto, metodoPago: e.target.value })}
                            >
                                <option>Efectivo</option>
                                <option>Transferencia</option>
                                <option>Cheque</option>
                                <option>Mixto</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Detalle (Opcional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={adelanto.detalle}
                                onChange={(e) => setAdelanto({ ...adelanto, detalle: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit">
                                Guardar Adelanto
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Ítem</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingItem && (
                        <Form onSubmit={handleUpdateItem}>
                            <Form.Group className="mb-3">
                                <Form.Label>Descripción del Producto</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingItem.productoDescripcion}
                                    onChange={(e) => setEditingItem({ ...editingItem, productoDescripcion: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Especificación (Color, Largo, etc.)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingItem.especificacion}
                                    onChange={(e) => setEditingItem({ ...editingItem, especificacion: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Cantidad</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editingItem.cantidadPedida}
                                    onChange={(e) => setEditingItem({ ...editingItem, cantidadPedida: e.target.value })}
                                    min="1"
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio Unitario</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>$</InputGroup.Text>
                                    <Form.Control
                                        type="number"
                                        value={editingItem.precioUnitario || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, precioUnitario: e.target.value })}
                                        step="0.01"
                                        min="0"
                                    />
                                </InputGroup>
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                Guardar Cambios
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default PedidoDetail;
