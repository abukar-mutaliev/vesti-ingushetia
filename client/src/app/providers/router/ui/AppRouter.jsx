import React, { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import styles from './AppRouter.module.scss';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary/ui/ErrorBoundary.jsx';
import { LoginForm } from '@entities/user/auth/ui/LoginForm/index.js';
import { RegisterForm } from '@entities/user/auth/ui/RegisterForm/index.js';
import { ProfilePage } from '@features/profile/ui/ProfilePage/index.js';

const HomePage = lazy(() =>
    import('@pages/HomePage').then((module) => ({
        default: module.HomePage,
    })),
);
const AdminDashboardPage = lazy(() =>
    import('@pages/Admin/AdminDashboardPage').then((module) => ({
        default: module.AdminDashboardPage,
    })),
);
const TVPage = lazy(() =>
    import('@pages/TVPage').then((module) => ({
        default: module.TVPage,
    })),
);
const LiveStreamPage = lazy(() =>
    import('@pages/LiveStreamPage').then((module) => ({
        default: module.LiveStreamPage,
    })),
);
const NewsListPage = lazy(() =>
    import('@pages/NewsPage').then((module) => ({
        default: module.NewsListPage,
    })),
);
const NewsDetailPage = lazy(() =>
    import('@pages/NewsDetailPage').then((module) => ({
        default: module.NewsDetailPage,
    })),
);
const AuthorDetailPage = lazy(() =>
    import('@pages/AuthorDetailPage').then((module) => ({
        default: module.AuthorDetailPage,
    })),
);
const CategoryPage = lazy(() =>
    import('@pages/CategoryPage').then((module) => ({
        default: module.CategoryPage,
    })),
);
const SearchResultsPage = lazy(() =>
    import('@features/search').then((module) => ({
        default: module.SearchResultsPage,
    })),
);
const AboutUsPage = lazy(() =>
    import('@pages/AboutUsPage').then((module) => ({
        default: module.AboutUsPage,
    })),
);

export function AppRouter() {
    return (
        <div className={styles.containerAppRouter}>
            <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboardPage />}
                    />

                    <Route path="/" element={<HomePage />} />
                    <Route path="/news" element={<NewsListPage />} />
                    <Route path="/news/:id" element={<NewsDetailPage />} />
                    <Route
                        path="/categories/:categoryId"
                        element={<CategoryPage />}
                    />
                    <Route
                        path="/search/results/"
                        element={<SearchResultsPage />}
                    />
                    <Route
                        path="/author/:authorId"
                        element={<AuthorDetailPage />}
                    />
                    <Route path="/tv" element={<TVPage />} />
                    <Route path="/live" element={<LiveStreamPage />} />
                    <Route path="/about" element={<AboutUsPage />} />
                </Routes>
            </ErrorBoundary>
        </div>
    );
}
