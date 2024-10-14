import React, { useState } from 'react';
import { Sidebar } from '@features/admin/Sidebar';
import { NewsSection } from '@features/admin/NewsSection';
import { UsersSection } from '@features/admin/UsersSection';
import { CommentsSection } from '@features/admin/CommentsSection';
import { EditNewsSection } from '@features/admin/EditNewsSection';
import { AddNewsSection } from '@features/admin/AddNewsSection';
import { CategoriesSection } from '@features/admin/CategoriesSection';
import { FaBars } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';
import styles from './AdminDashboard.module.scss';

export const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState('news');
    const [newsToEdit, setNewsToEdit] = useState(null);
    const [isAddingNews, setIsAddingNews] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleSectionChange = (section) => {
        setNewsToEdit(null);
        setIsAddingNews(false);
        setActiveSection(section);
        setIsSidebarOpen(false);
    };

    const renderSection = () => {
        if (isAddingNews) {
            return (
                <AddNewsSection
                    onSave={() => setIsAddingNews(false)}
                    onCancel={() => setIsAddingNews(false)}
                />
            );
        }

        if (newsToEdit) {
            return (
                <EditNewsSection
                    news={newsToEdit}
                    onSave={() => setNewsToEdit(null)}
                    onCancel={() => setNewsToEdit(null)}
                />
            );
        }

        switch (activeSection) {
            case 'news':
                return (
                    <NewsSection
                        onEditNews={setNewsToEdit}
                        onAddNews={() => setIsAddingNews(true)}
                    />
                );
            case 'comments':
                return <CommentsSection />;
            case 'users':
                return <UsersSection />;
            case 'categories':
                return <CategoriesSection />;
            default:
                return <NewsSection />;
        }
    };

    return (
        <div className={styles.dashboard}>
            <button
                className={`${styles.hamburgerMenu} ${isSidebarOpen ? styles.hidden : ''}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <FaBars size={24} />
            </button>

            <div
                className={`${styles.overlay} ${isSidebarOpen ? styles.active : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <div
                className={`${styles.sidebarContainer} ${isSidebarOpen ? styles.open : ''}`}
            >
                <button
                    className={styles.closeButton}
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <FaTimes size={24} />
                </button>
                <Sidebar onSectionChange={handleSectionChange} />
            </div>

            <div className={styles.content}>{renderSection()}</div>
        </div>
    );
};
