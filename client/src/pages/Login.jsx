
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        // Clear previous error when user edits the form
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const email = formData.email.trim().toLowerCase();
        const password = formData.password;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setError('Email is required.');
            return;
        }

        if (email.length > 254 || !emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        // Password validation
        if (!password.trim()) {
            setError('Password is required.');
            return;
        }

        setLoading(true);

        try {
            const response = await API.post('/auth/login', {
                email,
                password
            });

            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message || 'Login failed. Try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

                <h1 className="text-3xl font-bold text-center mb-2">
                    Welcome Back
                </h1>

                <p className="text-gray-500 text-center mb-8">
                    Login to manage your expenses
                </p>

                {/* Error Message */}
                {error && (
                    <div
                        role="alert"
                        className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email */}
                    <div>
                        <label className="block mb-2 font-medium">
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            maxLength={254}
                            autoComplete="email"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block mb-2 font-medium">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                </form>

                <p className="text-center mt-6 text-gray-600">
                    Don't have an account?{' '}

                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold"
                    >
                        Register
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Login;
