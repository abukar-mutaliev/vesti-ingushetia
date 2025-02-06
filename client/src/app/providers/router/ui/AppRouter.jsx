import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary/ui/ErrorBoundary.jsx';
import { LoginForm } from '@entities/user/auth/ui/LoginForm/index.js';
import { RegisterForm } from '@entities/user/auth/ui/RegisterForm/index.js';
import { ScrollToTop } from '@shared/lib/ScrollToTop/ScrollToTop';
import { Loader } from '@shared/ui/Loader/index.js';
import TooManyRequests from '@shared/ui/TooManyRequests/ui/TooManyRequests.jsx';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '@entities/user/auth/model/authSelectors.js';

const HomePage = lazy(() => import('@pages/HomePage/ui/HomePage'));
const ProfilePage = lazy(() => import('@pages/ProfilePage/ui/ProfilePage'));
const AdminDashboardPage = lazy(
    () => import('@pages/Admin/AdminDashboardPage/ui/AdminDashboardPage'),
);
const TVPage = lazy(() => import('@pages/TVPage/ui/TVPage'));
const RadioPage = lazy(() => import('@pages/RadioPage/ui/RadioPage'));
const LiveStreamPage = lazy(
    () => import('@pages/LiveStreamPage/ui/LiveStreamPage'),
);
const NewsListPage = lazy(() => import('@pages/NewsPage/ui/NewsListPage'));
const NewsDetailPage = lazy(
    () => import('@pages/NewsDetailPage/ui/NewsDetailPage'),
);
const AuthorDetailPage = lazy(
    () => import('@pages/AuthorDetailPage/ui/AuthorDetailPage'),
);
const CategoryPage = lazy(() => import('@pages/CategoryPage/ui/CategoryPage'));
const SearchResultsPage = lazy(
    () => import('@features/search/ui/SearchResultsPage'),
);
const AboutUsPage = lazy(() => import('@pages/AboutUsPage/ui/AboutUsPage'));
const TvProgramsPage = lazy(
    () => import('@pages/TvProgramsPage/ui/TvProgramsPage'),
);
const ProjectsPage = lazy(() => import('@pages/ProjectsPage/ui/ProjectsPage'));
const ProjectDetailPage = lazy(
    () => import('@pages/ProjectDetailPage/ui/ProjectDetailPage'),
);
const NotFoundPage = lazy(() => import('@pages/NotFoundPage/ui/NotFoundPage'));

export function AppRouter() {
    const isAdmin = useSelector(selectIsAdmin);

    return (
        <ErrorBoundary>
            <ScrollToTop />
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    {isAdmin ? (
                        <Route
                            path="/admin/dashboard"
                            element={<AdminDashboardPage />}
                        />
                    ) : (
                        <Route path="/login" element={<LoginForm />} />
                    )}

                    <Route path="/" element={<HomePage />} />
                    <Route path="/news" element={<NewsListPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route
                        path="/projects/:id"
                        element={<ProjectDetailPage />}
                    />
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
                    <Route path="*" element={<NotFoundPage />} />
                    <Route
                        path="/too-many-requests"
                        element={<TooManyRequests />}
                    />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}


