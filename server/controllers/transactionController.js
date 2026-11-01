
const Transaction = require('../models/Transaction');

// CREATE TRANSACTION
const createTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date, description } = req.body;

        if (!title || amount === undefined || !type || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, amount, type and category are required'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be income or expense'
            });
        }

        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        const transaction = await Transaction.create({
            user: req.user.id,
            title: title.trim(),
            amount: Number(amount),
            type,
            category: category.trim(),
            date: date || Date.now(),
            description: description || ''
        });

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            transaction
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create transaction'
        });
    }
};

// GET ALL TRANSACTIONS
const getTransactions = async (req, res) => {
    try {
        const {
            type,
            category,
            search,
            sort = 'newest',
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

        const filter = {
            user: req.user.id
        };

        if (type && ['income', 'expense'].includes(type)) {
            filter.type = type;
        }

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.title = {
                $regex: search,
                $options: 'i'
            };
        }

        const sortOption = sort === 'oldest'
            ? { date: 1 }
            : { date: -1 };

        const total = await Transaction.countDocuments(filter);

        const transactions = await Transaction.find(filter)
            .sort(sortOption)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            page: pageNumber,
            pages: Math.ceil(total / pageSize),
            transactions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
};

// UPDATE TRANSACTION
const updateTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, date, description } = req.body;

        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        if (title !== undefined) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Title cannot be empty'
                });
            }
            transaction.title = title.trim();
        }

        if (amount !== undefined) {
            if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
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
            if (typeof category !== 'string' || !category.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Category cannot be empty'
                });
            }
            transaction.category = category.trim();
        }

        if (date !== undefined) {
            const parsedDate = new Date(date);
            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date'
                });
            }
            transaction.date = parsedDate;
        }

        if (description !== undefined) {
            transaction.description = description;
        }

        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            transaction
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update transaction'
        });
    }
};

// DELETE TRANSACTION
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete transaction'
        });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
};
