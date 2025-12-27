import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, Table, InputGroup } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/api';

const RemitoForm = () => {
    const [searchParams] = useSearchParams();
    const idPedido = searchParams.get('idPedido');
    const navigate = useNavigate();

    // Estados del formulario
    const [pedido, setPedido] = useState(null);
    const [remitoItems, setRemitoItems] = useState([]);
    const [emisores, setEmisores] = useState([]);
    const [idEmisorSeleccionado, setIdEmisorSeleccionado] = useState('');

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!idPedido) {
            setError('No se especificó un ID de pedido para generar el remito.');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const pedidoResponse = await apiClient.get(`/pedidos/${idPedido}`);
                const pedidoData = pedidoResponse.data;
                setPedido(pedidoData);

                const itemsParaRemito = pedidoData.items.map(item => ({
                    productoDescripcion: item.productoDescripcion,
                    especificacion: item.especificacion,
                    cantidad: item.cantidadPedida,
                    precioUnitario: item.precioUnitario || ''
                }));
                setRemitoItems(itemsParaRemito);

                const emisoresResponse = await apiClient.get('/emisores');
                setEmisores(emisoresResponse.data);

                if (pedidoData.cliente && pedidoData.cliente.idEmisor) {
                    setIdEmisorSeleccionado(pedidoData.cliente.idEmisor);
                }

            } catch (err) {
                setError('No se pudo cargar la información necesaria para el remito.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [idPedido]);

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...remitoItems];
        updatedItems[index][field] = value;
        setRemitoItems(updatedItems);
    };

    // ✅ NUEVO: Función para añadir un nuevo ítem vacío
    const handleAddItem = () => {
        setRemitoItems([...remitoItems, { productoDescripcion: '', especificacion: '', cantidad: 1, precioUnitario: '' }]);
    };

    // ✅ NUEVO: Función para eliminar un ítem por su índice
    const handleRemoveItem = (index) => {
        const newItems = remitoItems.filter((_, i) => i !== index);
        setRemitoItems(newItems);
    };
    
    // ✅ NUEVO: Función para calcular el total del remito
    const calcularTotal = () => {
        return remitoItems.reduce((total, item) => {
            const precio = parseFloat(item.precioUnitario) || 0;
            const cantidad = parseInt(item.cantidad) || 0;
            return total + (precio * cantidad);
        }, 0).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!idEmisorSeleccionado) {
            setError('Por favor, selecciona un emisor.');
            return;
        }

        const remitoRequest = {
            idCliente: pedido.cliente.idCliente,
            idEmisor: parseInt(idEmisorSeleccionado),
            idPedidoOrigen: parseInt(idPedido),
            items: remitoItems.map(item => ({
                ...item,
                cantidad: parseInt(item.cantidad),
                precioUnitario: parseFloat(item.precioUnitario) || 0
            }))
        };

        try {
            const response = await apiClient.post('/remitos/desde-pedido', remitoRequest);
            alert(`¡Remito #${response.data.numeroRemito} creado con éxito!`);
            navigate(`/pedidos/${idPedido}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al generar el remito.');
            console.error(err);
        }
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!pedido) return <Alert variant="info">Cargando información del pedido...</Alert>;

    return (
        <Container className="mt-4">
            <h1>Crear Remito desde Pedido #{idPedido}</h1>
            <p>Cliente: <strong>{pedido.cliente.nombreFantasia || `${pedido.cliente.nombre} ${pedido.cliente.apellido}`}</strong></p>

            <Form onSubmit={handleSubmit}>
                <Card className="mb-3">
                    <Card.Header>Datos del Remito</Card.Header>
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Seleccionar Emisor</Form.Label>
                            <Form.Select
                                value={idEmisorSeleccionado}
                                onChange={(e) => setIdEmisorSeleccionado(e.target.value)}
                                required
                            >
                                <option value="">Selecciona un emisor...</option>
                                {emisores.map(emisor => (
                                    <option key={emisor.idEmisor} value={emisor.idEmisor}>
                                        {emisor.nombre}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>Ítems a Remitir</Card.Header>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Detalle</th>
                                <th>Especificación</th>
                                <th style={{ width: '10%' }}>Cant.</th>
                                <th style={{ width: '15%' }}>Precio Unit.</th>
                                <th style={{ width: '15%' }}>Subtotal</th>
                                <th style={{ width: '5%' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remitoItems.map((item, index) => {
                                const subtotal = (parseFloat(item.precioUnitario) || 0) * (parseInt(item.cantidad) || 0);
                                return (
                                    <tr key={index}>
                                        <td><Form.Control type="text" value={item.productoDescripcion} onChange={(e) => handleItemChange(index, 'productoDescripcion', e.target.value)} /></td>
                                        <td><Form.Control type="text" value={item.especificacion} onChange={(e) => handleItemChange(index, 'especificacion', e.target.value)} /></td>
                                        <td><Form.Control type="number" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} /></td>
                                        <td>
                                            <InputGroup>
                                                <InputGroup.Text>$</InputGroup.Text>
                                                <Form.Control type="number" value={item.precioUnitario} onChange={(e) => handleItemChange(index, 'precioUnitario', e.target.value)} step="0.01" />
                                            </InputGroup>
                                        </td>
                                        <td className="align-middle text-end">${subtotal.toFixed(2)}</td>
                                        <td className="text-center align-middle">
                                            <Button variant="danger" size="sm" onClick={() => handleRemoveItem(index)}>&times;</Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    {/* ✅ NUEVO: Botón para añadir ítems */}
                    <Card.Footer className="d-flex justify-content-between align-items-center">
                        <Button variant="secondary" onClick={handleAddItem}>Añadir Ítem</Button>
                        <div className="text-end">
                            <h4>Total: ${calcularTotal()}</h4>
                        </div>
                    </Card.Footer>
                </Card>

                <div className="mt-3 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/pedidos/${idPedido}`)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit">
                        Generar Remito
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default RemitoForm;
