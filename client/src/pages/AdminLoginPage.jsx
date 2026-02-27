import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import api from '../services/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = await api.adminLogin(password);
            // Store token securely (localStorage is okay for this version)
            localStorage.setItem('adminToken', token);
            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Invalid password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-box">
                <div className="admin-login-header">
                    <div className="admin-icon-container">
                        <Lock size={32} className="admin-icon" />
                    </div>
                    <h2>Admin Access</h2>
                    <p>Enter your password to access the dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="admin-login-form">
                    {error && <div className="admin-error-message">{error}</div>}

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary admin-login-btn"
                        disabled={loading || !password}
                    >
                        {loading ? 'Verifying...' : 'Login'}
                    </button>

                    <button
                        type="button"
                        className="btn-secondary admin-back-btn"
                        onClick={() => navigate('/')}
                    >
                        Return to Store
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
