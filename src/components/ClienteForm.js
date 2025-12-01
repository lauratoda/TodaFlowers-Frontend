import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/api';

const ClienteForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Para saber si estamos editando o creando
    const isEditing = !!id;

    const [cliente, setCliente] = useState({
        nombre: '',
        apellido: '',
        nombreFantasia: '',
        localidad: '',
        direccion: '',
        telefono: '',
        whatsapp: '',
        cuit: '',
        razonSocial: '',
        formaPago: '',
        idEmisor: '', // Campo clave
        modoCc: 'Remitos'
    });

    // Nuevo estado para la lista de emisores
    const [emisores, setEmisores] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        // 1. Cargar la lista de emisores
        apiClient.get('/emisores')
            .then(response => {
                setEmisores(response.data);
                // 2. Si estamos editando, cargar los datos del cliente
                if (isEditing) {
                    return apiClient.get(`/clientes/${id}`);
                }
            })
            .then(response => {
                if (response) { // Solo si hubo una segunda llamada
                    setCliente(response.data);
                }
            })
            .catch(err => {
                setError('No se pudo cargar la información necesaria.');
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCliente(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!cliente.idEmisor) {
            setError('Por favor, selecciona un emisor por defecto.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isEditing) {
                await apiClient.put(`/clientes/${id}`, cliente);
            } else {
                await apiClient.post('/clientes', cliente);
            }
            navigate('/clientes');
        } catch (err) {
            setError('Error al guardar el cliente. Revisa los datos e intenta de nuevo.');
            setLoading(false);
        }
    };

    if (loading && !cliente.nombreFantasia) return <Spinner animation="border" />;

    return (
        <Container className="mt-4">
            <h1>{isEditing ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</h1>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Card className="p-3">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control type="text" name="nombre" value={cliente.nombre || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control type="text" name="apellido" value={cliente.apellido || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre de Fantasía / Razón Social</Form.Label>
                        <Form.Control type="text" name="nombreFantasia" value={cliente.nombreFantasia || ''} onChange={handleChange} />
                    </Form.Group>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control type="text" name="telefono" value={cliente.telefono || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>WhatsApp</Form.Label>
                                <Form.Control type="text" name="whatsapp" value={cliente.whatsapp || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Localidad</Form.Label>
                                <Form.Control type="text" name="localidad" value={cliente.localidad || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Dirección</Form.Label>
                                <Form.Control type="text" name="direccion" value={cliente.direccion || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>CUIT</Form.Label>
                                <Form.Control type="text" name="cuit" value={cliente.cuit || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        {/* --- SELECTOR DE EMISOR AÑADIDO --- */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Emisor por Defecto</Form.Label>
                                <Form.Select name="idEmisor" value={cliente.idEmisor || ''} onChange={handleChange} required>
                                    <option value="">Selecciona un emisor...</option>
                                    {emisores.map(emisor => (
                                        <option key={emisor.idEmisor} value={emisor.idEmisor}>
                                            {emisor.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card>

                <div className="mt-3 d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate('/clientes')}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cliente'}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default ClienteForm;
