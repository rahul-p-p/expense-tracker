
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
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

        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;

        // Name validation
        if (name.length < 2 || name.length > 50) {
            setError('Name must be between 2 and 50 characters.');
            return;
        }

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
        if (password.length < 6) {
            setError('Password must contain at least 6 characters.');
            return;
        }

        // bcrypt password byte limit
        const passwordBytes = new TextEncoder().encode(password).length;

        if (passwordBytes > 72) {
            setError('Password must not exceed 72 bytes.');
            return;
        }

        setLoading(true);

        try {
            const response = await API.post('/auth/register', {
                name,
                email,
                password
            });

            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Registration failed. Try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

                <h1 className="text-3xl font-bold text-center mb-2">
                    Create Account
                </h1>

                <p className="text-gray-500 text-center mb-8">
                    Start managing your money today
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

                    {/* Full Name */}
                    <div>
                        <label className="block mb-2 font-medium">
                            Full Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                            minLength={2}
                            maxLength={50}
                            autoComplete="name"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

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
                            placeholder="Minimum 6 characters"
                            minLength={6}
                            required
                            autoComplete="new-password"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <p className="text-xs text-gray-500 mt-1">
                            Password must contain at least 6 characters.
                        </p>
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>

                </form>

                <p className="text-center mt-6 text-gray-600">
                    Already have an account?{' '}

                    <Link
                        to="/login"
                        className="text-blue-600 font-semibold"
                    >
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Register;
