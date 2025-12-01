import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Row, Col, Form, Table, Button, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';

const PedidoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Estados para el Modal de Edición ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchPedidoDetail = async () => {
        try {
            const response = await apiClient.get(`/pedidos/${id}`);
            setPedido(response.data);
        } catch (err) {
            setError('No se pudo cargar el detalle del pedido.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidoDetail();
    }, [id]);

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
            setError('No se pudo actualizar el item. Re-intentando...');
            setPedido(originalPedido);
            console.error(err);
        }
    };

    const handleEntregarPedido = async () => {
        if (window.confirm('¿Estás segura de que quieres marcar este pedido como ENTREGADO?')) {
            try {
                const response = await apiClient.put(`/pedidos/${id}/entregar`);
                setPedido(response.data);
            } catch (err) {
                setError('No se pudo marcar el pedido como entregado.');
                console.error(err);
            }
        }
    };

    const handleDeletePedido = async () => {
        if (window.confirm('¿Estás ABSOLUTAMENTE SEGURA de que quieres eliminar este pedido? Esta acción no se puede deshacer.')) {
            try {
                await apiClient.delete(`/pedidos/${id}`);
                navigate('/pedidos');
            } catch (err) {
                setError('No se pudo eliminar el pedido.');
                console.error(err);
            }
        }
    };

    const handleDeleteItem = async (idPedidoItem) => {
        if (window.confirm('¿Segura que quieres eliminar este ítem del pedido?')) {
            try {
                await apiClient.delete(`/pedidos/items/${idPedidoItem}`);
                fetchPedidoDetail();
            } catch (err) {
                setError('No se pudo eliminar el ítem.');
                console.error(err);
            }
        }
    };

    // --- Funciones para el Modal de Edición ---
    const handleShowEditModal = (item) => {
        setEditingItem({ ...item }); // Copiamos el item para no modificar el original directamente
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
                cantidadPedida: parseInt(editingItem.cantidadPedida)
            };
            await apiClient.put(`/pedidos/items/${editingItem.idPedidoItem}`, requestBody);
            handleCloseEditModal();
            fetchPedidoDetail(); // Recargamos los datos para ver los cambios
        } catch (err) {
            console.error("Error al actualizar el ítem", err);
            // Aquí podrías añadir un estado de error para el modal
        }
    };

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Cargando detalle del pedido...</p>
            </Container>
        );
    }

    if (error) {
        return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    if (!pedido) {
        return <Container className="mt-4"><Alert variant="warning">No se encontró el pedido.</Alert></Container>;
    }

    const isEntregadoOCancelado = pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO';

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1>Detalle del Pedido #{pedido.idPedido}</h1>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                    <Button variant="secondary" onClick={() => navigate('/pedidos')}>
                        Volver a la Lista
                    </Button>
                    {!isEntregadoOCancelado && (
                        <Button variant="success" onClick={handleEntregarPedido}>
                            Marcar como Entregado
                        </Button>
                    )}
                    {!isEntregadoOCancelado && (
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
                            <p><strong>Fecha de Entrega:</strong> {new Date(pedido.fechaEntrega).toLocaleDateString()}</p>
                        </Col>
                        <Col md={6}>
                            <p><strong>Estado:</strong> {pedido.estado}</p>
                            <p><strong>Fecha de Creación:</strong> {new Date(pedido.fechaCreacion).toLocaleString()}</p>
                        </Col>
                    </Row>
                    {pedido.notas && (
                        <>
                            <hr />
                            <p><strong>Notas:</strong> {pedido.notas}</p>
                        </>
                    )}
                </Card.Body>
            </Card>

            <Card className="mt-4">
                <Card.Header>Checklist de Items</Card.Header>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>OK</th>
                            <th>Cant.</th>
                            <th>Detalle</th>
                            <th>Especificación</th>
                            <th>Observaciones</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedido.items.map(item => (
                            <tr key={item.idPedidoItem} className={item.separado ? 'table-success' : ''}>
                                <td className="text-center align-middle">
                                    <Form.Check
                                        type="checkbox"
                                        checked={item.separado}
                                        onChange={(e) => handleChecklistItemUpdate(item.idPedidoItem, 'separado', e.target.checked)}
                                        disabled={isEntregadoOCancelado}
                                    />
                                </td>
                                <td className="align-middle">{item.cantidadPedida}</td>
                                <td className="align-middle">{item.productoDescripcion}</td>
                                <td className="align-middle">{item.especificacion}</td>
                                <td>
                                    <Form.Control
                                        type="text"
                                        placeholder="Obs."
                                        value={item.notasItem || ''}
                                        onChange={(e) => handleChecklistItemUpdate(item.idPedidoItem, 'notasItem', e.target.value)}
                                        size="sm"
                                        disabled={isEntregadoOCancelado}
                                    />
                                </td>
                                <td className="text-center align-middle">
                                    {!isEntregadoOCancelado && (
                                        <div className="d-flex gap-2 justify-content-center">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(item)}>
                                                Editar
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteItem(item.idPedidoItem)}>
                                                X
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            {/* --- Modal de Edición de Ítem --- */}
            <Modal show={showEditModal} onHide={handleCloseEditModal}>
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


