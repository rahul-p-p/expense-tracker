
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, X, Download } from 'lucide-react';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);

    const pageSize = 10;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [formError, setFormError] = useState('');

    // FETCH TRANSACTIONS WITH ALL FILTERS AND PAGINATION
    const fetchTransactions = async (requestedPage = currentPage) => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: requestedPage,
                limit: pageSize
            };

            if (search.trim()) params.search = search.trim();
            if (typeFilter) params.type = typeFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await API.get('/transactions', { params });

            const data = response.data;

            setTransactions(data.transactions || []);
            setTotalPages(data.pages || 1);
            setTotalTransactions(data.total || 0);

            // Handle an empty page after deleting a transaction
            if (
                requestedPage > 1 &&
                (data.transactions || []).length === 0 &&
                data.total > 0
            ) {
                setCurrentPage(requestedPage - 1);
            }
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
    }, [search, typeFilter, startDate, endDate, currentPage]);

    // FORM INPUT HANDLING
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // CLEAR ALL FILTERS
    const clearFilters = () => {
        setSearch('');
        setTypeFilter('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    // OPEN ADD FORM
    const openAddForm = () => {
        setEditingId(null);
        setFormData(initialForm);
        setFormError('');
        setShowForm(true);
    };

    // OPEN EDIT FORM
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

        setFormError('');
        setShowForm(true);
    };

    // ADD / UPDATE TRANSACTION
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const title = formData.title.trim();
        const category = formData.category.trim();
        const description = formData.description.trim();
        const amount = Number(formData.amount);

        // Validate title
        if (title.length < 2 || title.length > 100) {
            setFormError('Title must be between 2 and 100 characters.');
            return;
        }

        // Validate amount
        if (
            formData.amount === '' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setFormError('Please enter a valid amount greater than zero.');
            return;
        }

        // Validate category
        if (!category || category.length > 50) {
            setFormError('Please select a valid category.');
            return;
        }

        // Validate transaction type
        if (!['income', 'expense'].includes(formData.type)) {
            setFormError('Please select a valid transaction type.');
            return;
        }

        // Validate date
        const dateValue = formData.date;
        const parsedDate = new Date(`${dateValue}T00:00:00`);

        if (
            !dateValue ||
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== dateValue
        ) {
            setFormError('Please select a valid transaction date.');
            return;
        }

        // Validate description
        if (description.length > 500) {
            setFormError('Description cannot exceed 500 characters.');
            return;
        }

        const payload = {
            title,
            amount,
            type: formData.type,
            category,
            date: dateValue,
            description
        };

        try {
            setSaving(true);
            setError('');

            if (editingId) {
                await API.put(`/transactions/${editingId}`, payload);
            } else {
                await API.post('/transactions', payload);
            }

            setShowForm(false);
            setEditingId(null);
            setFormData(initialForm);
            setFormError('');

            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                await fetchTransactions(1);
            }

        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                'Unable to save transaction. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };


    // DELETE TRANSACTION
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

    // EXPORT ALL FILTERED TRANSACTIONS TO CSV
    const handleExportCSV = async () => {
        try {
            setExporting(true);
            setError('');

            const params = {
                page: 1,
                limit: 100
            };

            if (search.trim()) params.search = search.trim();
            if (typeFilter) params.type = typeFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            // Fetch the first page
            const firstResponse = await API.get('/transactions', { params });

            let allTransactions = firstResponse.data.transactions || [];
            const totalPagesToFetch = firstResponse.data.pages || 1;

            // Fetch remaining pages, if any
            for (let page = 2; page <= totalPagesToFetch; page++) {
                const response = await API.get('/transactions', {
                    params: {
                        ...params,
                        page
                    }
                });

                allTransactions = [
                    ...allTransactions,
                    ...(response.data.transactions || [])
                ];
            }

            if (allTransactions.length === 0) {
                setError('No transactions available to export.');
                return;
            }

            // Escape CSV values safely
            const escapeCSV = (value) => {
                const text = String(value ?? '');
                return `"${text.replace(/"/g, '""')}"`;
            };

            const headers = [
                'Title',
                'Amount',
                'Type',
                'Category',
                'Date',
                'Description'
            ];

            const rows = allTransactions.map((transaction) => [
                transaction.title,
                transaction.amount,
                transaction.type,
                transaction.category,
                new Date(transaction.date).toLocaleDateString('en-IN'),
                transaction.description || ''
            ]);

            const csvContent = [
                headers.map(escapeCSV).join(','),
                ...rows.map(row => row.map(escapeCSV).join(','))
            ].join('\n');

            // Add BOM so Excel handles UTF-8 correctly
            const blob = new Blob(
                ['\uFEFF' + csvContent],
                { type: 'text/csv;charset=utf-8;' }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `expense-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to export transactions.'
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:pl-72">
            <Sidebar />

            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
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

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="border border-green-600 text-green-700 px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-green-50 disabled:opacity-50"
                        >
                            <Download size={20} />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>

                        <button
                            onClick={openAddForm}
                            className="bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Add Transaction
                        </button>
                    </div>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-5">
                        {error}
                    </div>
                )}

                {/* SEARCH AND FILTERS */}
                <div className="bg-white p-5 rounded-xl shadow-sm mb-6 space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border p-3 rounded-lg w-full"
                        >
                            <option value="">All Transactions</option>
                            <option value="income">Income</option>
                            <option value="expense">Expenses</option>
                        </select>
                    </div>

                    {/* DATE FILTERS */}
                    <div>
                        <p className="font-medium text-gray-700 mb-3">
                            Filter by Date Range
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Start Date
                                </label>

                                <input
                                    type="date"
                                    value={startDate}
                                    max={endDate || undefined}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border p-3 rounded-lg w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    End Date
                                </label>

                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border p-3 rounded-lg w-full"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="w-full border border-gray-300 p-3 rounded-lg hover:bg-gray-100"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TRANSACTION LIST */}
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
                            No transactions found. Try changing your filters.
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
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        transaction.type === 'income'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {transaction.type}
                                                </span>
                                            </td>

                                            <td
                                                className={`p-4 font-semibold whitespace-nowrap ${
                                                    transaction.type === 'income'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
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

                {/* PAGINATION */}
                {!loading && totalTransactions > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 bg-white rounded-xl shadow-sm mt-4">

                        <p className="text-sm text-gray-600">
                            Showing page {currentPage} of {totalPages}
                            {' '}({totalTransactions} transactions)
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setCurrentPage(prev => Math.max(1, prev - 1))
                                }
                                disabled={currentPage === 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                Previous
                            </button>

                            <span className="font-semibold text-gray-700">
                                {currentPage}
                            </span>

                            <button
                                onClick={() =>
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                                }
                                disabled={currentPage >= totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
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

                            {/* Display validation error */}
                            {formError && (
                                <div
                                    role="alert"
                                    className="bg-red-100 text-red-700 p-3 rounded-lg text-sm"
                                >
                                    {formError}
                                </div>
                            )}
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
                                    minLength={2}
                                    maxLength={100}
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
                                    required
                                    min="0.01"
                                    step="0.01"
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
                                    maxLength={500}
                                    placeholder="Optional description"
                                    className="w-full border p-3 rounded-lg"
                                />

                                <p className="text-xs text-gray-500 text-right">
                                    {formData.description.length}/500 characters
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
