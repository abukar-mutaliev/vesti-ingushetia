import { useEffect, useState } from 'react';
import { useDispatch, useSelector as useReduxSelector } from 'react-redux';
import { Sidebar } from '@features/admin/Sidebar';
import { NewsSection } from '@features/admin/NewsSection';
import { UsersSection } from '@features/admin/UsersSection';
import { CommentsSection } from '@features/admin/CommentsSection';
import { EditNewsSection } from '@features/admin/NewsSection/EditNewsSection';
import { AddNewsSection } from '@features/admin/NewsSection/AddNewsSection';
import { CategoriesSection } from '@features/admin/CategoriesSection';
import { RadioSection } from '@features/admin/RadioSection';
import { FaBars, FaTimes } from 'react-icons/fa';
import styles from './AdminDashboard.module.scss';
import { EditRadioSection } from '@features/admin/RadioSection/EditRadioSection/index.js';
import { AddRadioSection } from '@features/admin/RadioSection/AddRadioSection/index.js';
import { TvProgramsSection } from '@features/admin/TvProgramsSection/index.js';
import { AddTvProgramsSection } from '@features/admin/TvProgramsSection/AddTvProgramsSection/ui/AddTvProgramsSection.jsx';
import { EditTvProgramSection } from '@features/admin/TvProgramsSection/EditTvProgramSection';
import { VideoAdSection } from '@features/admin/VideoAdSection';
import { EditVideoAdSection } from '@features/admin/VideoAdSection/EditVideoAdSection/index.js';
import { AddVideoAdSection } from '@features/admin/VideoAdSection/AddVideoAdSection/index.js';
import { ProjectsSection } from '@features/admin/ProjectsSection';
import { AddProjectSection } from '@features/admin/ProjectsSection/AddProjectSection';
import { EditProjectSection } from '@features/admin/ProjectsSection/EditProjectSection';
import { selectIsAdmin } from '@entities/user/auth/model/authSelectors.js';
import { useNavigate } from 'react-router-dom';

const LOCAL_STORAGE_KEY_ADD_NEWS = 'adminDashboard_addNewsSectionFormData';
const LOCAL_STORAGE_KEY_ACTIVE_SECTION = 'adminDashboard_activeSection';
const LOCAL_STORAGE_KEY_ADD_PROJECT = 'adminDashboard_addProjectSectionFormData';

export const AdminDashboard = () => {
    const dispatch = useDispatch();
    const [activeSection, setActiveSection] = useState(() => {
        const savedSection = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_SECTION);
        return savedSection ? savedSection : 'news';
    });
    const [newsToEdit, setNewsToEdit] = useState(null);
    const [isAddingNews, setIsAddingNews] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [radioToEdit, setRadioToEdit] = useState(null);
    const [isAddingRadio, setIsAddingRadio] = useState(false);
    const [isAddingTvPrograms, setIsAddingTvPrograms] = useState(false);
    const [tvProgramToEdit, setTvProgramToEdit] = useState(null);
    const [isAddingVideoAd, setIsAddingVideoAd] = useState(false);
    const [videoAdToEdit, setVideoAdToEdit] = useState(null);
    const [projectToEdit, setProjectToEdit] = useState(null);
    const [isAddingProject, setIsAddingProject] = useState(false);
    const isAdmin = useReduxSelector(selectIsAdmin);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin) {
            navigate('/login');
        }
    }, [isAdmin, navigate]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_SECTION, activeSection);
    }, [activeSection]);

    useEffect(() => {
        const savedFormData = localStorage.getItem(LOCAL_STORAGE_KEY_ADD_NEWS);
        if (activeSection === 'news' && savedFormData) {
            setIsAddingNews(true);
        } else {
            setIsAddingNews(false);
        }
    }, [activeSection]);

    useEffect(() => {
        const savedFormData = localStorage.getItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
        if (activeSection === 'projects' && savedFormData) {
            setIsAddingProject(true);
        } else {
            setIsAddingProject(false);
        }
    }, [activeSection]);

    const handleSectionChange = (section) => {
        setNewsToEdit(null);
        setIsAddingNews(false);
        setRadioToEdit(null);
        setIsAddingRadio(false);
        setTvProgramToEdit(null);
        setIsAddingTvPrograms(false);
        setActiveSection(section);
        setIsSidebarOpen(false);
        setIsAddingVideoAd(false);
        setVideoAdToEdit(null);
        setProjectToEdit(null);
        setIsAddingProject(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        if (isAddingRadio) {
            return (
                <AddRadioSection
                    onSave={() => setIsAddingRadio(false)}
                    onCancel={() => setIsAddingRadio(false)}
                />
            );
        }
        if (radioToEdit) {
            return (
                <EditRadioSection
                    radio={radioToEdit}
                    onSave={() => setRadioToEdit(null)}
                    onCancel={() => setRadioToEdit(null)}
                />
            );
        }
        if (isAddingProject) {
            return (
                <AddProjectSection
                    onSave={() => setIsAddingProject(false)}
                    onCancel={() => setIsAddingProject(false)}
                />
            );
        }
        if (projectToEdit) {
            return (
                <EditProjectSection
                    project={projectToEdit}
                    onSave={() => setProjectToEdit(null)}
                    onCancel={() => setProjectToEdit(null)}
                />
            );
        }
        if (isAddingTvPrograms) {
            return (
                <AddTvProgramsSection
                    onSave={() => setIsAddingTvPrograms(false)}
                    onCancel={() => setIsAddingTvPrograms(false)}
                />
            );
        }
        if (tvProgramToEdit) {
            return (
                <EditTvProgramSection
                    tvProgram={tvProgramToEdit}
                    onSave={() => setTvProgramToEdit(null)}
                    onCancel={() => setTvProgramToEdit(null)}
                />
            );
        }
        if (isAddingVideoAd) {
            return (
                <AddVideoAdSection
                    onSave={() => {
                        setIsAddingVideoAd(false);
                        setActiveSection('videoAd');
                    }}
                    onCancel={() => setIsAddingVideoAd(false)}
                />
            );
        }

        if (videoAdToEdit) {
            return (
                <EditVideoAdSection
                    videoAd={videoAdToEdit}
                    onSave={() => setVideoAdToEdit(null)}
                    onCancel={() => setVideoAdToEdit(null)}
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
            case 'projects':
                return (
                    <ProjectsSection
                        onAddProject={() => setIsAddingProject(true)}
                        onEditProject={setProjectToEdit}
                    />
                );
            case 'comments':
                return <CommentsSection />;
            case 'users':
                return <UsersSection />;
            case 'categories':
                return <CategoriesSection />;
            case 'radio':
                return (
                    <RadioSection
                        onEditRadio={setRadioToEdit}
                        onAddRadio={() => setIsAddingRadio(true)}
                    />
                );
            case 'tvPrograms':
                return (
                    <TvProgramsSection
                        onAddTvProgram={() => setIsAddingTvPrograms(true)}
                        onEditTvProgram={setTvProgramToEdit}
                    />
                );
            case 'videoAd':
                return (
                    <VideoAdSection
                        onAddVideoAd={() => setIsAddingVideoAd(true)}
                        onEditVideoAd={setVideoAdToEdit}
                    />
                );
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
