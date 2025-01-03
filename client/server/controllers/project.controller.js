const { Project, Media, sequelize } = require('../models');
const { posix } = require('path');
const fs = require('fs');
const path = require('path');
const baseUrl = process.env.BASE_URL;

function formatMediaUrls(projectItems) {
    return projectItems.map((item) => ({
        ...item.toJSON(),
        mediaFiles: item.mediaFiles.map((media) => {
            let formattedUrl = media.url;

            if (media.type === 'image') {
                if (!media.url.startsWith(baseUrl)) {
                    formattedUrl = `${baseUrl}/${media.url}`;
                }
            } else if (media.type === 'video') {
                if (!/^https?:\/\//i.test(media.url)) {
                    if (!media.url.startsWith(baseUrl)) {
                        formattedUrl = `${baseUrl}/${media.url}`;
                    }
                }
            }

            return {
                ...media.toJSON(),
                url: formattedUrl,
            };
        }),
    }));
}

exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: Media, as: 'mediaFiles' }],
        });

        const modifiedProjects = formatMediaUrls(projects);
        res.json(modifiedProjects);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения проектов: ${err.message}`,
        });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id, {
            include: [{ model: Media, as: 'mediaFiles' }],
        });

        if (!project)
            return res.status(404).json({ message: 'Проект не найден' });

        const modifiedProject = formatMediaUrls([project])[0];
        res.json(modifiedProject);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения проекта: ${err.message}`,
        });
    }
};

exports.createProject = async (req, res) => {
    const { title, content, videoUrls } = req.body;
    const mediaFiles = req.files;

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const project = await Project.create(
            { title, content },
            { transaction },
        );

        const mediaInstances = [];

        if (mediaFiles) {
            if (mediaFiles.images) {
                for (let file of mediaFiles.images) {
                    const media = await Media.create(
                        {
                            url: posix.join('uploads', 'images', file.filename),
                            type: 'image',
                        },
                        { transaction },
                    );
                    mediaInstances.push(media);
                }
            }

            if (mediaFiles.videos) {
                for (let file of mediaFiles.videos) {
                    const media = await Media.create(
                        {
                            url: posix.join('uploads', 'videos', file.filename),
                            type: 'video',
                        },
                        { transaction },
                    );
                    mediaInstances.push(media);
                }
            }
        }

        if (videoUrls && Array.isArray(videoUrls)) {
            for (let url of videoUrls) {
                const media = await Media.create(
                    {
                        url: url,
                        type: 'video',
                    },
                    { transaction },
                );
                mediaInstances.push(media);
            }
        }

        if (mediaInstances.length > 0) {
            await project.addMediaFiles(mediaInstances, { transaction });
        }

        await transaction.commit();
        res.status(201).json(project);
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({
            error: `Ошибка создания проекта: ${err.message}`,
        });
    }
};

exports.updateProject = async (req, res) => {
    const { id } = req.params;
    const { title, content, existingMedia, videoUrls } = req.body;
    const mediaFiles = req.files;

    try {
        const project = await Project.findByPk(id, {
            include: [{ model: Media, as: 'mediaFiles' }],
        });
        if (!project)
            return res.status(404).json({ error: 'Проект не найден' });

        const existingMediaIds = JSON.parse(existingMedia || '[]');
        let transaction;
        try {
            transaction = await sequelize.transaction();

            await project.update({ title, content }, { transaction });

            const mediaToDelete = project.mediaFiles.filter(
                (media) => !existingMediaIds.includes(media.id),
            );

            for (let media of mediaToDelete) {
                const mediaPath = path.join(
                    __dirname,
                    '..',
                    media.url.startsWith(baseUrl)
                        ? media.url.replace(`${baseUrl}/`, '')
                        : media.url,
                );
                fs.unlink(mediaPath, (err) => {
                    if (err) console.error('Ошибка удаления медиафайла:', err);
                });
            }

            await Media.destroy({
                where: { id: mediaToDelete.map((media) => media.id) },
                transaction,
            });

            const mediaInstances = [];

            if (mediaFiles) {
                if (mediaFiles.images) {
                    for (let file of mediaFiles.images) {
                        const media = await Media.create(
                            {
                                url: posix.join(
                                    'uploads',
                                    'images',
                                    file.filename,
                                ),
                                type: 'image',
                            },
                            { transaction },
                        );
                        mediaInstances.push(media);
                    }
                }

                if (mediaFiles.videos) {
                    for (let file of mediaFiles.videos) {
                        const media = await Media.create(
                            {
                                url: posix.join(
                                    'uploads',
                                    'videos',
                                    file.filename,
                                ),
                                type: 'video',
                            },
                            { transaction },
                        );
                        mediaInstances.push(media);
                    }
                }
            }

            if (videoUrls && Array.isArray(videoUrls)) {
                for (let url of videoUrls) {
                    const media = await Media.create(
                        {
                            url: url,
                            type: 'video',
                        },
                        { transaction },
                    );
                    mediaInstances.push(media);
                }
            }

            if (mediaInstances.length > 0) {
                await project.addMediaFiles(mediaInstances, { transaction });
            }

            await transaction.commit();

            const updatedProject = await Project.findByPk(id, {
                include: [{ model: Media, as: 'mediaFiles' }],
            });

            const modifiedProject = {
                ...updatedProject.toJSON(),
                mediaFiles: updatedProject.mediaFiles.map((media) => ({
                    ...media.toJSON(),
                    url: media.url.startsWith(baseUrl)
                        ? media.url
                        : `${baseUrl}/${media.url}`,
                })),
                videoUrls: videoUrls,
            };

            res.status(200).json(modifiedProject);
        } catch (err) {
            if (transaction) await transaction.rollback();
            res.status(500).json({
                error: `Ошибка обновления проекта: ${err.message}`,
            });
        }
    } catch (err) {
        res.status(500).json({ error: `Ошибка: ${err.message}` });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(id, {
            include: [{ model: Media, as: 'mediaFiles' }],
        });

        if (!project)
            return res.status(404).json({ error: 'Проект не найден' });

        for (let media of project.mediaFiles) {
            if (!media.url.startsWith('https')) {
                const mediaPath = path.join(
                    __dirname,
                    '..',
                    media.url.replace(`${baseUrl}/`, ''),
                );
                fs.unlink(mediaPath, (err) => {
                    if (err) console.error('Ошибка удаления медиафайла:', err);
                });
            }
        }

        await Media.destroy({
            where: { id: project.mediaFiles.map((media) => media.id) },
        });

        await project.destroy();

        res.json({ message: 'Проект удален' });
    } catch (err) {
        res.status(500).json({
            error: `Ошибка удаления проекта: ${err.message}`,
        });
    }
};
