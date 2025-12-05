import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Row, Col, Form, Table, Button, Modal, InputGroup, ButtonGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';

const PedidoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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
    }, [id]);

    // --- FUNCIÓN REFACTORIZADA PARA MANEJAR ACCIONES ---
    const handleAction = async (action, confirmMessage, successMessage, errorMessage) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
            return;
        }
        
        try {
            await action();
            if (successMessage) alert(successMessage);
            // --- LA CLAVE ESTÁ AQUÍ: Volvemos a cargar los datos ---
            setLoading(true);

            fetchPedidoDetail();
        } catch (err) {
            setError(err.response?.data?.message || errorMessage);
            console.error(err);
        }
    };
    
    const handleEntregarPedido = () => handleAction(
        () => apiClient.put(`/pedidos/${id}/entregar`),
        '¿Estás segura de que quieres marcar este pedido como ENTREGADO?',
        null, // No mostramos alert para esta acción
        'No se pudo marcar el pedido como entregado.'
    );

    const handleRemitirPedido = () => handleAction(
        () => apiClient.post(`/pedidos/${id}/remitir`),
        '¿Estás segura de que quieres generar un remito para este pedido?',
        '¡Remito creado con éxito!',
        'No se pudo generar el remito.'
    );

    const handleFacturarPedido = () => navigate(`/facturas/nuevo/${id}`);

    const handleDeletePedido = () => handleAction(
        () => apiClient.delete(`/pedidos/${id}`),
        '¿Estás ABSOLUTAMENTE SEGURA de que quieres eliminar este pedido? Esta acción no se puede deshacer.',
        null,
        'No se pudo eliminar el pedido.'
    ).then(() => navigate('/pedidos'));


    // (El resto de las funciones de manejo de items, modales, etc. no necesitan cambios)
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

    const handleShowEditModal = (item) => {
        setEditingItem({ ...item });
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingItem(null);
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
            handleCloseEditModal();
            fetchPedidoDetail();
        } catch (err) {
            console.error("Error al actualizar el ítem", err);
        }
    };
    
    const calcularTotalPedido = () => {
        if (!pedido || !pedido.items) return '0.00';
        return pedido.items.reduce((total, item) => {
            const precio = parseFloat(item.precioUnitario) || 0;
            const cantidad = parseInt(item.cantidadPedida) || 0;
            return total + (precio * cantidad);
        }, 0).toFixed(2);
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

    // La lógica para deshabilitar botones ahora es más precisa
    const puedeEditar = !['ENTREGADO', 'CANCELADO', 'REMITIDO', 'FACTURADO'].includes(pedido.estado);
    const puedeEntregar = ['PENDIENTE', 'EN_PREPARACION', 'PREPARADO_COMPLETO', 'PREPARADO_INCOMPLETO', 'LISTO_PARA_DESPACHO'].includes(pedido.estado);
    const puedeRemitir = pedido.estado === 'ENTREGADO';
    const puedeFacturar = pedido.estado === 'ENTREGADO' || pedido.estado === 'REMITIDO';


    return (
        <Container className="mt-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="align-items-center mb-4">
                <Col><h1>Detalle del Pedido #{pedido.idPedido}</h1></Col>
                <Col xs="auto" className="d-flex flex-wrap justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate('/pedidos')}>Volver</Button>
                    
                    {puedeEditar && (
                        <Button variant="primary" onClick={() => navigate(`/pedidos/editar/${id}`)}>
                            Editar Pedido
                        </Button>
                    )}

                    {puedeEntregar && (
                        <Button variant="success" onClick={handleEntregarPedido}>
                            Marcar como Entregado
                        </Button>
                    )}

                    {puedeRemitir && (
                        <Button variant="warning" onClick={handleRemitirPedido}>Remitir</Button>
                    )}
                    
                    {puedeFacturar && (
                         <Button variant="info" onClick={handleFacturarPedido}>Facturar</Button>
                    )}

                    {puedeEditar && (
                        <Button variant="danger" onClick={handleDeletePedido}>
                            Eliminar Pedido
                        </Button>
                    )}
                </Col>
            </Row>
            
            <Card>
                <Card.Header>Información General</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <p><strong>Cliente:</strong> {pedido.cliente?.nombreFantasia || `${pedido.cliente?.nombre} ${pedido.cliente?.apellido}`}</p>
                            <p><strong>Fecha de Entrega:</strong> {new Date(pedido.fechaEntrega).toLocaleDateString('es-AR')}</p>
                        </Col>
                        <Col md={6}>
                            <p><strong>Estado:</strong> {pedido.estado}</p>
                            <p><strong>Total Aproximado:</strong> ${calcularTotalPedido()}</p>
                        </Col>
                    </Row>
                    {pedido.notas && <><hr /><p><strong>Notas:</strong> {pedido.notas}</p></>}
                </Card.Body>
            </Card>

            <Card className="mt-4">
                <Card.Header>Checklist de Items</Card.Header>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>OK</th><th>Cant.</th><th>Detalle</th><th>Especificación</th><th>Precio Unit.</th><th>Subtotal</th><th>Observaciones</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedido.items.map(item => {
                            const subtotal = (parseFloat(item.precioUnitario) || 0) * (parseInt(item.cantidadPedida) || 0);
                            return (
                                <tr key={item.idPedidoItem} className={item.separado ? 'table-success' : ''}>
                                    <td className="text-center align-middle"><Form.Check type="checkbox" checked={item.separado} onChange={() => {}} disabled={!puedeEditar} /></td>
                                    <td className="align-middle">{item.cantidadPedida}</td>
                                    <td className="align-middle">{item.productoDescripcion}</td>
                                    <td className="align-middle">{item.especificacion}</td>
                                    <td className="align-middle text-end">${parseFloat(item.precioUnitario || 0).toFixed(2)}</td>
                                    <td className="align-middle text-end">${subtotal.toFixed(2)}</td>
                                    <td><Form.Control type="text" placeholder="Obs." value={item.notasItem || ''} onChange={() => {}} size="sm" disabled={!puedeEditar} /></td>
                                    <td className="text-center align-middle">
                                        {puedeEditar && (
                                            <ButtonGroup size="sm">
                                                <Button variant="outline-primary" onClick={() => handleShowEditModal(item)}>Editar</Button>
                                                <Button variant="outline-danger" onClick={() => handleDeleteItem(item.idPedidoItem)}>X</Button>
                                            </ButtonGroup>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>
            
            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton><Modal.Title>Editar Ítem</Modal.Title></Modal.Header>
                <Modal.Body>
                    {editingItem && (
                        <Form onSubmit={handleUpdateItem}>
                            <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control type="text" value={editingItem.productoDescripcion} onChange={(e) => setEditingItem({ ...editingItem, productoDescripcion: e.target.value })} required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Especificación</Form.Label><Form.Control type="text" value={editingItem.especificacion} onChange={(e) => setEditingItem({ ...editingItem, especificacion: e.target.value })} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Cantidad</Form.Label><Form.Control type="number" value={editingItem.cantidadPedida} onChange={(e) => setEditingItem({ ...editingItem, cantidadPedida: e.target.value })} min="1" required /></Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio Unitario</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>$</InputGroup.Text>
                                    <Form.Control type="number" value={editingItem.precioUnitario || ''} onChange={(e) => setEditingItem({ ...editingItem, precioUnitario: e.target.value })} step="0.01" min="0" />
                                </InputGroup>
                            </Form.Group>
                            <Button variant="primary" type="submit">Guardar Cambios</Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default PedidoDetail;