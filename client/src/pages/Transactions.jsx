
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, X } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

const initialForm = {
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
    description: ''
};

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount || 0);

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [saving, setSaving] = useState(false);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {};

            if (search.trim()) params.search = search.trim();
            if (typeFilter) params.type = typeFilter;

            const response = await API.get('/transactions', { params });

            setTransactions(response.data.transactions || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load transactions.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [search, typeFilter]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const openAddForm = () => {
        setEditingId(null);
        setFormData(initialForm);
        setShowForm(true);
    };

    const openEditForm = (transaction) => {
        setEditingId(transaction._id);

        setFormData({
            title: transaction.title,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            date: new Date(transaction.date).toISOString().slice(0, 10),
            description: transaction.description || ''
        });

        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');

            const payload = {
                ...formData,
                amount: Number(formData.amount)
            };

            if (editingId) {
                await API.put(`/transactions/${editingId}`, payload);
            } else {
                await API.post('/transactions', payload);
            }

            setShowForm(false);
            setEditingId(null);
            setFormData(initialForm);

            await fetchTransactions();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to save transaction.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this transaction?'
        );

        if (!confirmed) return;

        try {
            await API.delete(`/transactions/${id}`);
            await fetchTransactions();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to delete transaction.'
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:pl-72">
            <Sidebar />
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">

                    <div>
                        <Link
                            to="/dashboard"
                            className="text-blue-600 flex items-center gap-2 mb-3"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </Link>

                        <h1 className="text-3xl font-bold text-gray-800">
                            Transactions
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Manage your income and expenses
                        </p>
                    </div>

                    <button
                        onClick={openAddForm}
                        className="bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Add Transaction
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-5">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-5 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="border p-3 rounded-lg w-full"
                    >
                        <option value="">All Transactions</option>
                        <option value="income">Income</option>
                        <option value="expense">Expenses</option>
                    </select>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">

                    <div className="p-5 border-b">
                        <h2 className="text-lg font-semibold">
                            All Transactions
                        </h2>
                    </div>

                    {loading ? (
                        <p className="p-8 text-center text-gray-500">
                            Loading transactions...
                        </p>
                    ) : transactions.length === 0 ? (
                        <p className="p-8 text-center text-gray-500">
                            No transactions found. Add your first transaction!
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm">
                                    <tr>
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr
                                            key={transaction._id}
                                            className="border-t hover:bg-gray-50"
                                        >
                                            <td className="p-4 font-medium">
                                                {transaction.title}
                                                {transaction.description && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {transaction.description}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                {transaction.category}
                                            </td>

                                            <td className="p-4 whitespace-nowrap">
                                                {new Date(
                                                    transaction.date
                                                ).toLocaleDateString('en-IN')}
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    transaction.type === 'income'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {transaction.type}
                                                </span>
                                            </td>

                                            <td className={`p-4 font-semibold whitespace-nowrap ${
                                                transaction.type === 'income'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }`}>
                                                {transaction.type === 'income'
                                                    ? '+'
                                                    : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </td>

                                            <td className="p-4">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => openEditForm(transaction)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(transaction._id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">
                                {editingId ? 'Edit Transaction' : 'Add Transaction'}
                            </h2>

                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-500 hover:text-gray-800"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div>
                                <label className="block mb-1 font-medium">
                                    Transaction Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Grocery shopping"
                                    className="w-full border p-3 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    min="0.01"
                                    step="0.01"
                                    required
                                    placeholder="Enter amount"
                                    className="w-full border p-3 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full border p-3 rounded-lg"
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full border p-3 rounded-lg"
                                >
                                    <option>Food</option>
                                    <option>Transport</option>
                                    <option>Shopping</option>
                                    <option>Entertainment</option>
                                    <option>Health</option>
                                    <option>Education</option>
                                    <option>Salary</option>
                                    <option>Work</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full border p-3 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Optional description"
                                    className="w-full border p-3 rounded-lg"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingId
                                        ? 'Update Transaction'
                                        : 'Save Transaction'}
                            </button>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Transactions;
