
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);

    const links = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard
        },
        {
            name: 'Transactions',
            path: '/transactions',
            icon: Receipt
        }
    ];

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg"
            >
                {open ? <X /> : <Menu />}
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}

            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64
                bg-slate-900 text-white p-6
                transform transition-transform duration-300
                md:translate-x-0
                ${open ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center gap-3 mb-10">
                    <Wallet size={30} className="text-blue-400" />
                    <h1 className="text-xl font-bold">
                        Expense Tracker
                    </h1>
                </div>

                <nav className="space-y-3">
                    {links.map((link) => {
                        const Icon = link.icon;

                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-3 rounded-lg transition ${
                                        isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-slate-800'
                                    }`
                                }
                            >
                                <Icon size={20} />
                                {link.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <button
                    onClick={logout}
                    className="absolute bottom-8 left-6 right-6 flex items-center gap-3 p-3 rounded-lg text-red-300 hover:bg-slate-800"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>
        </>
    );
}

export default Sidebar;
