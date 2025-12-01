import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Row, Col, Form, Table, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom'; // 1. Importamos useNavigate
import apiClient from '../api/api';

const PedidoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // 2. Preparamos la herramienta de navegación
    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            // Después de actualizar un item, volvemos a pedir los datos del pedido
            // para asegurarnos de que el estado general (PENDIENTE, EN_PREPARACION, etc.) esté actualizado.
            fetchPedidoDetail();
        } catch (err) {
            setError('No se pudo actualizar el item. Re-intentando...');
            setPedido(originalPedido); // Revertimos el cambio visual si falla la API
            console.error(err);
        }
    };

    const handleEntregarPedido = async () => {
        if (window.confirm('¿Estás segura de que quieres marcar este pedido como ENTREGADO?')) {
            try {
                const response = await apiClient.put(`/pedidos/${id}/entregar`);
                setPedido(response.data); // Actualizamos el pedido con la respuesta de la API
            } catch (err) {
                setError('No se pudo marcar el pedido como entregado.');
                console.error(err);
            }
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
                    {/* 3. Añadimos el botón "Volver" */}
                    <Button variant="secondary" onClick={() => navigate('/pedidos')}>
                        Volver a la Lista
                    </Button>
                    {!isEntregadoOCancelado && (
                        <Button variant="success" onClick={handleEntregarPedido}>
                            Marcar como Entregado
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
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </Container>
    );
};

export default PedidoDetail;
