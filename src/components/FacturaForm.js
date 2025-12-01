import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert, Table, InputGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';

const FacturaForm = () => {
    const { idPedido } = useParams();
    const navigate = useNavigate();

    // Estado para el pedido original y los items de la factura
    const [pedido, setPedido] = useState(null);
    const [facturaItems, setFacturaItems] = useState([]);

    // Nuevos estados para emisores
    const [emisores, setEmisores] = useState([]);
    const [idEmisorSeleccionado, setIdEmisorSeleccionado] = useState('');

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cargar datos del pedido original y la lista de emisores
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar pedido
                const pedidoResponse = await apiClient.get(`/pedidos/${idPedido}`);
                setPedido(pedidoResponse.data);

                const itemsConPrecio = pedidoResponse.data.items.map(item => ({
                    productoDescripcion: item.productoDescripcion,
                    especificacion: item.especificacion,
                    cantidad: item.cantidadPedida,
                    precioUnitario: item.precioUnitario || ''
                }));
                setFacturaItems(itemsConPrecio);

                // Cargar emisores
                const emisoresResponse = await apiClient.get('/emisores');
                setEmisores(emisoresResponse.data);
                // Si solo hay un emisor, seleccionarlo por defecto
                if (emisoresResponse.data.length === 1) {
                    setIdEmisorSeleccionado(emisoresResponse.data[0].idEmisor);
                }

            } catch (err) {
                setError('No se pudo cargar la información necesaria para facturar.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [idPedido]);

    // --- Funciones para manejar el formulario ---

    const handlePriceChange = (index, newPrice) => {
        const updatedItems = [...facturaItems];
        updatedItems[index].precioUnitario = newPrice;
        setFacturaItems(updatedItems);
    };

    const calcularTotal = () => {
        return facturaItems.reduce((total, item) => {
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

        // Verificamos que todos los items tengan un precio
        const itemsSinPrecio = facturaItems.filter(item => !item.precioUnitario || parseFloat(item.precioUnitario) <= 0);
        if (itemsSinPrecio.length > 0) {
            setError('Por favor, completa el precio para todos los ítems y asegúrate de que sean mayores a cero.');
            return;
        }

        // Creamos el objeto que enviaremos al backend
        const facturaRequest = {
            idEmisor: parseInt(idEmisorSeleccionado),
            items: facturaItems.map(item => ({
                productoDescripcion: item.productoDescripcion,
                especificacion: item.especificacion,
                cantidad: item.cantidad,
                precioUnitario: parseFloat(item.precioUnitario)
            }))
        };

        try {
            const response = await apiClient.post(`/pedidos/${idPedido}/facturar`, facturaRequest);
            alert(`¡Factura #${response.data.idFactura} creada con éxito!`);
            navigate(`/pedidos/${idPedido}`); // Volvemos al detalle del pedido
        } catch (err) {
            setError(err.response?.data?.message || 'Error al generar la factura.');
            console.error(err);
        }
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!pedido) return <Alert variant="info">Cargando pedido...</Alert>;

    return (
        <Container className="mt-4">
            <h1>Crear Factura desde Pedido #{idPedido}</h1>
            <p>Cliente: <strong>{pedido.cliente.nombreFantasia || `${pedido.cliente.nombre} ${pedido.cliente.apellido}`}</strong></p>
            
            <Form onSubmit={handleSubmit}>
                <Card className="mb-3">
                    <Card.Header>Datos de Facturación</Card.Header>
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
                    <Card.Header>Completar Precios de Ítems</Card.Header>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Cant.</th>
                                <th>Detalle</th>
                                <th>Especificación</th>
                                <th style={{ width: '150px' }}>Precio Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturaItems.map((item, index) => {
                                const subtotal = (parseFloat(item.precioUnitario) || 0) * (parseInt(item.cantidad) || 0);
                                return (
                                    <tr key={index}>
                                        <td className="align-middle">{item.cantidad}</td>
                                        <td className="align-middle">{item.productoDescripcion}</td>
                                        <td className="align-middle">{item.especificacion}</td>
                                        <td>
                                            <InputGroup>
                                                <InputGroup.Text>$</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    value={item.precioUnitario}
                                                    onChange={(e) => handlePriceChange(index, e.target.value)}
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                />
                                            </InputGroup>
                                        </td>
                                        <td className="align-middle text-end">${subtotal.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="4" className="text-end"><strong>Total</strong></td>
                                <td className="text-end"><strong>${calcularTotal()}</strong></td>
                            </tr>
                        </tfoot>
                    </Table>
                </Card>

                <div className="mt-3 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/pedidos/${idPedido}`)}>
                        Volver
                    </Button>
                    <Button variant="primary" type="submit">
                        Generar Factura
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default FacturaForm;


