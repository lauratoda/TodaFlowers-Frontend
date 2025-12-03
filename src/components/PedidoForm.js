import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PedidoForm = () => {
    const { id } = useParams(); // Obtenemos el ID de la URL
    const isEditing = !!id; // True si hay un ID, false si no (estamos creando)
    const navigate = useNavigate();

    // Estados del formulario
    const [clientes, setClientes] = useState([]);
    const [idCliente, setIdCliente] = useState('');
    const [fechaEntrega, setFechaEntrega] = useState(new Date());
    const [notas, setNotas] = useState('');
    const [items, setItems] = useState([{ productoDescripcion: '', especificacion: '', cantidadPedida: 1, precioUnitario: '' }]);
    
    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Siempre cargamos los clientes
                const clientesResponse = await apiClient.get('/clientes');
                setClientes(clientesResponse.data.content || []);

                // Si estamos editando, cargamos los datos del pedido
                if (isEditing) {
                    const pedidoResponse = await apiClient.get(`/pedidos/${id}`);
                    const pedido = pedidoResponse.data;
                    
                    // Pre-populamos el formulario con los datos del pedido
                    setIdCliente(pedido.cliente.idCliente);
                    setFechaEntrega(new Date(pedido.fechaEntrega));
                    setNotas(pedido.notas || '');
                    setItems(pedido.items.length > 0 ? pedido.items : [{ productoDescripcion: '', especificacion: '', cantidadPedida: 1, precioUnitario: '' }]);
                }
            } catch (err) {
                setError('No se pudo cargar la información necesaria.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    const handleItemChange = (index, event) => {
        const newItems = [...items];
        newItems[index][event.target.name] = event.target.value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { productoDescripcion: '', especificacion: '', cantidadPedida: 1, precioUnitario: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!idCliente) {
            setError('Por favor, selecciona un cliente.');
            return;
        }

        const pedidoData = {
            idCliente: parseInt(idCliente),
            fechaEntrega: fechaEntrega.toISOString().split('T')[0],
            notas,
            items: items.map(item => ({
                idPedidoItem: item.idPedidoItem || null, // Importante para la actualización
                productoDescripcion: item.productoDescripcion,
                especificacion: item.especificacion,
                cantidadPedida: parseInt(item.cantidadPedida),
                precioUnitario: item.precioUnitario ? parseFloat(item.precioUnitario) : null,
            })),
        };

        try {
            if (isEditing) {
                // Si estamos editando, usamos PUT
                await apiClient.put(`/pedidos/${id}`, pedidoData);
            } else {
                // Si estamos creando, usamos POST
                await apiClient.post('/pedidos', pedidoData);
            }
            navigate('/pedidos');
        } catch (err) {
            setError(`Error al ${isEditing ? 'actualizar' : 'crear'} el pedido. Revisa los datos.`);
            console.error(err);
        }
    };

    const calcularTotalPedido = () => {
        return items.reduce((total, item) => {
            const precio = parseFloat(item.precioUnitario) || 0;
            const cantidad = parseInt(item.cantidadPedida) || 0;
            return total + (precio * cantidad);
        }, 0).toFixed(2);
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container className="mt-4">
            {/* --- CAMBIO AQUÍ: Título dinámico --- */}
            <h1>{isEditing ? `Editar Pedido #${id}` : 'Crear Nuevo Pedido'}</h1>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Card className="p-3">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Cliente</Form.Label>
                                <Form.Select value={idCliente} onChange={(e) => setIdCliente(e.target.value)} disabled={isEditing}>
                                    <option value="">Selecciona un cliente...</option>
                                    {clientes.map(cliente => (
                                        <option key={cliente.idCliente} value={cliente.idCliente}>
                                            {cliente.nombreFantasia || `${cliente.nombre} ${cliente.apellido}`}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fecha de Entrega</Form.Label>
                                <DatePicker selected={fechaEntrega} onChange={(date) => setFechaEntrega(date)} dateFormat="dd/MM/yyyy" className="form-control" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Notas Generales</Form.Label>
                        <Form.Control as="textarea" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
                    </Form.Group>
                    <hr />
                    <h5>Items del Pedido</h5>
                    {items.map((item, index) => {
                        const subtotal = (parseFloat(item.precioUnitario) || 0) * (parseInt(item.cantidadPedida) || 0);
                        return (
                            <Row key={item.idPedidoItem || index} className="mb-2 align-items-center">
                                <Col md={4}><Form.Control type="text" name="productoDescripcion" placeholder="Descripción" value={item.productoDescripcion} onChange={(e) => handleItemChange(index, e)} required /></Col>
                                <Col md={3}><Form.Control type="text" name="especificacion" placeholder="Especificación" value={item.especificacion} onChange={(e) => handleItemChange(index, e)} /></Col>
                                <Col md={2}><Form.Control type="number" name="cantidadPedida" placeholder="Cant." value={item.cantidadPedida} onChange={(e) => handleItemChange(index, e)} min="1" required /></Col>
                                <Col md={2}>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control type="number" name="precioUnitario" placeholder="Precio" value={item.precioUnitario || ''} onChange={(e) => handleItemChange(index, e)} step="0.01" min="0" />
                                    </InputGroup>
                                </Col>
                                <Col md={1}><Button variant="danger" size="sm" onClick={() => handleRemoveItem(index)}>&times;</Button></Col>
                                <Col xs={12} className="text-end"><small>Subtotal: ${subtotal.toFixed(2)}</small></Col>
                            </Row>
                        );
                    })}
                    <Button variant="secondary" onClick={handleAddItem} className="mt-2">Añadir Item</Button>
                    <div className="text-end mt-3"><h4>Total Aproximado: ${calcularTotalPedido()}</h4></div>
                </Card>
                <div className="mt-3 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate('/pedidos')}>Cancelar</Button>
                    <Button variant="primary" type="submit">{isEditing ? 'Guardar Cambios' : 'Guardar Pedido'}</Button>
                </div>
            </Form>
        </Container>
    );
};

export default PedidoForm;

