import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PedidoForm = () => {
    // Estados para el formulario principal
    const [clientes, setClientes] = useState([]);
    const [idCliente, setIdCliente] = useState('');
    const [fechaEntrega, setFechaEntrega] = useState(new Date());
    const [notas, setNotas] = useState('');

    // Estado para la lista dinámica de items, ahora con 'precioUnitario'
    const [items, setItems] = useState([{ productoDescripcion: '', especificacion: '', cantidadPedida: 1, precioUnitario: '' }]);

    // Estados para la carga y errores
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Cargar la lista de clientes cuando el componente se monta
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await apiClient.get('/clientes');
                // --- CORRECCIÓN AQUÍ ---
                // El backend devuelve un objeto de paginación, los clientes están en 'content'.
                // Nos aseguramos de que sea un array con '|| []'.
                setClientes(response.data.content || []);
            } catch (err) {
                setError('No se pudo cargar la lista de clientes.');
            } finally {
                setLoading(false);
            }
        };
        fetchClientes();
    }, []);

    // --- Funciones para manejar los items dinámicos ---
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

    // --- Función para enviar el formulario ---
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
                ...item,
                cantidadPedida: parseInt(item.cantidadPedida),
                // Aseguramos que el precio se envíe como número o como null si está vacío
                precioUnitario: item.precioUnitario ? parseFloat(item.precioUnitario) : null,
            })),
        };

        try {
            await apiClient.post('/pedidos', pedidoData);
            navigate('/pedidos'); // Redirige a la lista de pedidos si es exitoso
        } catch (err) {
            setError('Error al crear el pedido. Revisa los datos e intenta de nuevo.');
            console.error(err);
        }
    };

    // --- Cálculo del total del pedido ---
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
            <h1>Crear Nuevo Pedido</h1>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Card className="p-3">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Cliente</Form.Label>
                                <Form.Select value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
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
                                <DatePicker
                                    selected={fechaEntrega}
                                    onChange={(date) => setFechaEntrega(date)}
                                    dateFormat="dd/MM/yyyy"
                                    className="form-control"
                                />
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
                            <Row key={index} className="mb-2 align-items-center">
                                <Col md={4}>
                                    <Form.Control type="text" name="productoDescripcion" placeholder="Descripción" value={item.productoDescripcion} onChange={(e) => handleItemChange(index, e)} required />
                                </Col>
                                <Col md={3}>
                                    <Form.Control type="text" name="especificacion" placeholder="Especificación" value={item.especificacion} onChange={(e) => handleItemChange(index, e)} />
                                </Col>
                                <Col md={2}>
                                    <Form.Control type="number" name="cantidadPedida" placeholder="Cant." value={item.cantidadPedida} onChange={(e) => handleItemChange(index, e)} min="1" required />
                                </Col>
                                <Col md={2}>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control type="number" name="precioUnitario" placeholder="Precio" value={item.precioUnitario} onChange={(e) => handleItemChange(index, e)} step="0.01" min="0" />
                                    </InputGroup>
                                </Col>
                                <Col md={1}>
                                    <Button variant="danger" size="sm" onClick={() => handleRemoveItem(index)}>&times;</Button>
                                </Col>
                                <Col xs={12} className="text-end">
                                    <small>Subtotal: ${subtotal.toFixed(2)}</small>
                                </Col>
                            </Row>
                        );
                    })}
                    <Button variant="secondary" onClick={handleAddItem} className="mt-2">Añadir Item</Button>
                    
                    <div className="text-end mt-3">
                        <h4>Total Aproximado: ${calcularTotalPedido()}</h4>
                    </div>
                </Card>

                <div className="mt-3">
                    <Button variant="primary" type="submit">Guardar Pedido</Button>
                </div>
            </Form>
        </Container>
    );
};

export default PedidoForm;

