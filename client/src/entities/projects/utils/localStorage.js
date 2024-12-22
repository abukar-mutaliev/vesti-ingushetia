
const PROJECT_LOCAL_STORAGE_KEY = 'projectList';

export const saveProjectsToLocalStorage = (projectList) => {
    try {
        const serializedProjects = JSON.stringify(projectList);
        localStorage.setItem(PROJECT_LOCAL_STORAGE_KEY, serializedProjects);
    } catch (error) {
        console.error('Ошибка при сохранении проектов в localStorage:', error);
    }
};

export const loadProjectsFromLocalStorage = () => {
    const storedProjects = localStorage.getItem(PROJECT_LOCAL_STORAGE_KEY);
    if (storedProjects) {
        try {
            const parsedProjects = JSON.parse(storedProjects);
            return parsedProjects.map(project => ({
                ...project,
                videoUrls: Array.isArray(project.videoUrls) ? project.videoUrls : []
            }));
        } catch (error) {
            console.error('Ошибка при разборе проектов из localStorage:', error);
            return [];
        }
    }
    return [];
};
