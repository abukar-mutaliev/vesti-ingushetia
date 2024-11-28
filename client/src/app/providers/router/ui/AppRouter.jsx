import React, { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary/ui/ErrorBoundary.jsx';
import { LoginForm } from '@entities/user/auth/ui/LoginForm/index.js';
import { RegisterForm } from '@entities/user/auth/ui/RegisterForm/index.js';
import { ScrollToTop } from '@shared/lib/ScrollToTop/ScrollToTop';

const HomePage = lazy(() =>
    import('@pages/HomePage').then((module) => ({
        default: module.HomePage,
    })),
);
const ProfilePage = lazy(() =>
    import('@pages/ProfilePage').then((module) => ({
        default: module.ProfilePage,
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
const RadioPage = lazy(() =>
    import('@pages/RadioPage').then((module) => ({
        default: module.RadioPage,
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
const TvProgramsPage = lazy(() =>
    import('@pages/TvProgramsPage').then((module) => ({
        default: module.TvProgramsPage,
    })),
);
const ProjectsPage = lazy(() =>
    import('@pages/ProjectsPage').then((module) => ({
        default: module.ProjectsPage,
    })),
);
const ProjectDetailPage = lazy(() =>
    import('@pages/ProjectDetailPage').then((module) => ({
        default: module.ProjectDetailPage,
    })),
);

export function AppRouter() {
    return (
        <ErrorBoundary>
            <ScrollToTop />
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
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
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
                <Route path="/program" element={<TvProgramsPage />} />
                <Route path="/radio" element={<RadioPage />} />
                <Route path="/live" element={<LiveStreamPage />} />
                <Route path="/about" element={<AboutUsPage />} />
            </Routes>
        </ErrorBoundary>
    );
}
