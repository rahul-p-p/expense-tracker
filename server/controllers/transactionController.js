
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// -------------------- VALIDATION HELPERS --------------------

const isValidDate = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        return false;
    }

    const parsedDate = new Date(value);
    return !Number.isNaN(parsedDate.getTime());
};

const isValidDateFilter = (value) => {
    if (typeof value !== 'string') return false;

    // Accept YYYY-MM-DD only for date-range filters.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const parsedDate = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === value
    );
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const isValidAmount = (value) => {
    if (
        value === '' ||
        value === null ||
        value === undefined ||
        typeof value === 'boolean'
    ) {
        return false;
    }

    const amount = Number(value);

    return Number.isFinite(amount) && amount > 0;
};

const isValidText = (value, maxLength) => {
    return (
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength
    );
};

// -------------------- CREATE TRANSACTION --------------------

const createTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date, description } = req.body;

        if (
            !isValidText(title, 100) ||
            !isValidText(category, 50)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Title and category are required. Title must be within 100 characters and category within 50 characters.'
            });
        }

        if (!isValidAmount(amount)) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be income or expense'
            });
        }

        if (date !== undefined && !isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction date'
            });
        }

        if (
            description !== undefined &&
            (typeof description !== 'string' || description.length > 500)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Description must be text and cannot exceed 500 characters'
            });
        }

        const transaction = await Transaction.create({
            user: req.user.id,
            title: title.trim(),
            amount: Number(amount),
            type,
            category: category.trim(),
            date: date || new Date(),
            description: description ? description.trim() : ''
        });

        return res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction
        });

    } catch (error) {
        console.error('Create transaction error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to create transaction'
        });
    }
};

// -------------------- GET TRANSACTIONS --------------------

const getTransactions = async (req, res) => {
    try {
        const {
            type,
            category,
            search,
            sort = 'newest',
            page = '1',
            limit = '10',
            startDate,
            endDate
        } = req.query;

        // Validate pagination
        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(pageSize) ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid page or limit. Page must be positive and limit must be between 1 and 100.'
            });
        }

        // Validate filters
        if (type && !['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type filter'
            });
        }

        if (
            category !== undefined &&
            (typeof category !== 'string' || category.length > 50)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category filter'
            });
        }

        if (
            search !== undefined &&
            (typeof search !== 'string' || search.length > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Search must be text and cannot exceed 100 characters'
            });
        }

        if (!['newest', 'oldest'].includes(sort)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort option'
            });
        }

        const filter = {
            user: req.user.id
        };

        if (type) {
            filter.type = type;
        }

        if (category && category.trim()) {
            filter.category = category.trim();
        }

        if (search && search.trim()) {
            filter.title = {
                $regex: escapeRegex(search.trim()),
                $options: 'i'
            };
        }

        // Date range filter
        if (startDate || endDate) {
            const dateFilter = {};

            if (startDate) {
                if (!isValidDateFilter(startDate)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid start date. Use YYYY-MM-DD format.'
                    });
                }

                dateFilter.$gte = new Date(
                    `${startDate}T00:00:00.000Z`
                );
            }

            if (endDate) {
                if (!isValidDateFilter(endDate)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid end date. Use YYYY-MM-DD format.'
                    });
                }

                const end = new Date(`${endDate}T00:00:00.000Z`);
                end.setUTCDate(end.getUTCDate() + 1);

                // Exclusive upper boundary includes the full end date.
                dateFilter.$lt = end;
            }

            if (
                dateFilter.$gte &&
                dateFilter.$lt &&
                dateFilter.$gte >= dateFilter.$lt
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date must be before or equal to end date'
                });
            }

            filter.date = dateFilter;
        }

        const sortOption = sort === 'oldest'
            ? { date: 1, createdAt: 1 }
            : { date: -1, createdAt: -1 };

        const [total, transactions] = await Promise.all([
            Transaction.countDocuments(filter),

            Transaction.find(filter)
                .sort(sortOption)
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNumber,
            limit: pageSize,
            pages: Math.ceil(total / pageSize),
            hasNextPage: pageNumber * pageSize < total,
            hasPreviousPage: pageNumber > 1,
            transactions
        });

    } catch (error) {
        console.error('Get transactions error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
};

// -------------------- UPDATE TRANSACTION --------------------

const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID'
            });
        }

        const {
            title,
            amount,
            type,
            category,
            date,
            description
        } = req.body;

        const transaction = await Transaction.findOne({
            _id: id,
            user: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        if (title !== undefined) {
            if (!isValidText(title, 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'Title cannot be empty or exceed 100 characters'
                });
            }

            transaction.title = title.trim();
        }

        if (amount !== undefined) {
            if (!isValidAmount(amount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number'
                });
            }

            transaction.amount = Number(amount);
        }

        if (type !== undefined) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid transaction type'
                });
            }

            transaction.type = type;
        }

        if (category !== undefined) {
            if (!isValidText(category, 50)) {
                return res.status(400).json({
                    success: false,
                    message: 'Category cannot be empty or exceed 50 characters'
                });
            }

            transaction.category = category.trim();
        }

        if (date !== undefined) {
            if (!isValidDate(date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid transaction date'
                });
            }

            transaction.date = new Date(date);
        }

        if (description !== undefined) {
            if (
                typeof description !== 'string' ||
                description.length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Description must be text and cannot exceed 500 characters'
                });
            }

            transaction.description = description.trim();
        }

        await transaction.save();

        return res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            transaction
        });

    } catch (error) {
        console.error('Update transaction error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update transaction'
        });
    }
};

// -------------------- DELETE TRANSACTION --------------------

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID'
            });
        }

        const transaction = await Transaction.findOneAndDelete({
            _id: id,
            user: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        console.error('Delete transaction error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete transaction'
        });
    }
};

// -------------------- EXPORT CONTROLLERS --------------------

module.exports = {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
};
