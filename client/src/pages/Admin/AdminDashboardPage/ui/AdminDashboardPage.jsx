import React, { useEffect } from 'react';
import { AdminDashboard } from '@features/admin/AdminDashboard/index.js';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@shared/ui/Loader/index.js';
import {
    selectIsAdmin,
    selectUserAuth,
} from '@entities/user/auth/model/authSelectors.js';

const AdminDashboardPage = () => {
    const isAuthenticated = useSelector(selectUserAuth);
    const isAdmin = useSelector(selectIsAdmin);
    const rehydrated = useSelector((state) => state._persist?.rehydrated);
    const navigate = useNavigate();

    useEffect(() => {
        if (rehydrated) {
            if (!isAuthenticated || !isAdmin) {
                navigate('/login');
            }
        }
    }, [isAuthenticated, isAdmin, navigate, rehydrated]);

    if (!rehydrated) {
        return <Loader />;
    }

    return <AdminDashboard />;
};
export default AdminDashboardPage;
