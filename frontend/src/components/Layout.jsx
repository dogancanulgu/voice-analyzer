import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, LayoutDashboard, Upload } from 'lucide-react';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/upload', label: 'Upload', icon: Upload },
    ];

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-inner">
                    <Link to="/" className="logo">
                        <Mic className="logo-icon" size={24} />
                        <span>VoiceAnalyzer</span>
                    </Link>

                    <nav className="nav-menu">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx("nav-link", isActive && "active")}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
