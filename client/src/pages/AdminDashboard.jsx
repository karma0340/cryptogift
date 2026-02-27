import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, DollarSign, Package, CheckCircle, RefreshCcw } from 'lucide-react';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    // Fulfill Modal State
    const [fulfillModal, setFulfillModal] = useState({ show: false, order: null });
    const [giftCardCode, setGiftCardCode] = useState('');
    const [giftCardPin, setGiftCardPin] = useState('');
    const [fulfilling, setFulfilling] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
            return;
        }
        fetchData();
    }, [filter, token, navigate]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const statsData = await api.getAdminStats(token);
            setStats(statsData);

            const ordersData = await api.getAdminOrders(token, 1, 50, filter);
            setOrders(ordersData.orders);
        } catch (err) {
            if (err.message.includes('token') || err.message.includes('401')) {
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
            } else {
                setError('Failed to fetch dashboard data. ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const openFulfillModal = (order) => {
        setFulfillModal({ show: true, order });
        setGiftCardCode('');
        setGiftCardPin('');
    };

    const submitFulfill = async (e) => {
        e.preventDefault();
        setFulfilling(true);
        try {
            await api.fulfillAdminOrder(token, fulfillModal.order.orderId, giftCardCode, giftCardPin);
            setFulfillModal({ show: false, order: null });
            fetchData(); // Refresh list
        } catch (err) {
            alert(err.message || 'Failed to fulfill order');
        } finally {
            setFulfilling(false);
        }
    };

    if (loading && !stats) return <div className="admin-loading">Loading Dashboard...</div>;

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <h1>CryptoGift Admin</h1>
                    <span className="badge">Production</span>
                </div>
                <div className="admin-header-right">
                    <button onClick={fetchData} className="btn-icon" title="Refresh">
                        <RefreshCcw size={20} />
                    </button>
                    <button onClick={handleLogout} className="btn-secondary logout-btn">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            <main className="admin-main">
                {error && <div className="admin-error-message">{error}</div>}

                {/* Stats Cards */}
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon revenue"><DollarSign size={24} /></div>
                            <div className="stat-details">
                                <h3>Total Revenue</h3>
                                <p className="stat-value">${stats.revenue.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon pending"><Package size={24} /></div>
                            <div className="stat-details">
                                <h3>Pending Orders</h3>
                                <p className="stat-value">{stats.pendingOrders}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon completed"><CheckCircle size={24} /></div>
                            <div className="stat-details">
                                <h3>Completed Orders</h3>
                                <p className="stat-value">{stats.completedOrders}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Section */}
                <div className="admin-section">
                    <div className="section-header">
                        <h2>Recent Orders</h2>
                        <div className="filter-group">
                            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                            <button className={filter === 'pending' || filter === 'payment_received' ? 'active' : ''} onClick={() => setFilter('payment_received')}>Pending Fulfill</button>
                            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Gift Card</th>
                                    <th>Crypto Paid</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && orders.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">Loading orders...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">No orders found.</td></tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order._id}>
                                            <td className="mono">{order.orderId}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>{order.email}</td>
                                            <td>{order.brand.name} <strong>${order.amount}</strong></td>
                                            <td className="mono">{order.crypto.amount} {order.crypto.currency.toUpperCase()}</td>
                                            <td>
                                                <span className={`status-badge status-${order.status}`}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                {order.status !== 'completed' && order.status !== 'failed' ? (
                                                    <button
                                                        className="btn-primary sm"
                                                        onClick={() => openFulfillModal(order)}
                                                    >
                                                        Fulfill Now
                                                    </button>
                                                ) : (
                                                    <button className="btn-secondary sm disabled" disabled>
                                                        Done
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Fulfill Modal */}
            {fulfillModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content admin-modal">
                        <h2>Fulfill Order {fulfillModal.order?.orderId}</h2>
                        <p className="modal-subtitle">
                            Purchased: {fulfillModal.order?.brand.name} for ${fulfillModal.order?.amount}
                        </p>

                        <div className="fulfillment-instructions">
                            1. Check your email/wallet to confirm receipt of exactly <strong>{fulfillModal.order?.crypto.amount} {fulfillModal.order?.crypto.currency.toUpperCase()}</strong>.<br />
                            2. Manually purchase the gift card online.<br />
                            3. Enter the final <strong>Code</strong> below to email it to `{fulfillModal.order?.email}`.
                        </div>

                        <form onSubmit={submitFulfill}>
                            <div className="form-group">
                                <label>Gift Card Code (Required)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. AQBW-Y7XY..."
                                    value={giftCardCode}
                                    onChange={(e) => setGiftCardCode(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Gift Card PIN (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Leave blank if none"
                                    value={giftCardPin}
                                    onChange={(e) => setGiftCardPin(e.target.value)}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setFulfillModal({ show: false, order: null })}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={fulfilling || !giftCardCode}>
                                    {fulfilling ? 'Fulfilling...' : 'Send Gift Card & Complete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
