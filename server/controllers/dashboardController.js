
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const objectId = new mongoose.Types.ObjectId(userId);

        const now = new Date();

        // Date boundaries
        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const nextMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        const startOfYear = new Date(
            now.getFullYear(),
            0,
            1
        );

        const nextYearStart = new Date(
            now.getFullYear() + 1,
            0,
            1
        );

        const [
            overall,
            monthly,
            yearly,
            categories,
            recentTransactions
        ] = await Promise.all([

            // Overall financial summary
            Transaction.aggregate([
                { $match: { user: objectId } },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ]),

            // Current month summary
            Transaction.aggregate([
                {
                    $match: {
                        user: objectId,
                        date: {
                            $gte: startOfMonth,
                            $lt: nextMonthStart
                        }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ]),

            // Current year summary
            Transaction.aggregate([
                {
                    $match: {
                        user: objectId,
                        date: {
                            $gte: startOfYear,
                            $lt: nextYearStart
                        }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ]),

            // Expense category breakdown
            Transaction.aggregate([
                {
                    $match: {
                        user: objectId,
                        type: 'expense'
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: '$amount' }
                    }
                },
                { $sort: { total: -1 } }
            ]),

            // Recent transactions
            Transaction.find({ user: objectId })
                .sort({ date: -1, createdAt: -1 })
                .limit(5)
        ]);

        const getTotal = (data, type) =>
            data.find(item => item._id === type)?.total || 0;

        const income = getTotal(overall, 'income');
        const expense = getTotal(overall, 'expense');

        const monthlyIncome = getTotal(monthly, 'income');
        const monthlyExpense = getTotal(monthly, 'expense');

        const yearlyIncome = getTotal(yearly, 'income');
        const yearlyExpense = getTotal(yearly, 'expense');

        res.status(200).json({
            success: true,

            summary: {
                totalIncome: income,
                totalExpense: expense,
                balance: income - expense
            },

            monthly: {
                income: monthlyIncome,
                expense: monthlyExpense,
                balance: monthlyIncome - monthlyExpense
            },

            yearly: {
                income: yearlyIncome,
                expense: yearlyExpense,
                balance: yearlyIncome - yearlyExpense
            },

            categoryBreakdown: categories.map(item => ({
                category: item._id,
                amount: item.total
            })),

            recentTransactions
        });

    } catch (error) {
        console.error('Dashboard error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard'
        });
    }
};

module.exports = { getDashboard };
