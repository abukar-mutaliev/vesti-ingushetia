const { ElectionPdf, ElectionBanner } = require('../models');
const { posix } = require('path');
const path = require('path');
const fs = require('fs').promises;
const baseUrl = process.env.BASE_URL;
const {
    MAX_ELECTION_PDFS,
} = require('../constants/electionPdfDocuments');

const DEFAULT_BANNER_TITLE = 'Выборы 2026';

const parseBooleanField = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value === 'true' || value === '1';
    }
    return Boolean(value);
};

const formatPdfResponse = (pdf) => ({
    id: pdf.id,
    title: pdf.title,
    sortOrder: pdf.sortOrder,
    originalFilename: pdf.originalFilename,
    url: `${baseUrl}/${pdf.url}`,
    updatedAt: pdf.updatedAt,
});

const getPdfTitleFromFilename = (filename) =>
    filename.replace(/\.pdf$/i, '').trim() || filename;

const getNextSortOrder = async () => {
    const maxSortOrder = await ElectionPdf.max('sortOrder');
    return Number.isFinite(maxSortOrder) ? maxSortOrder + 1 : 1;
};

const findPdfById = async (id) => {
    const pdfId = Number.parseInt(id, 10);

    if (!Number.isInteger(pdfId)) {
        return null;
    }

    return ElectionPdf.findByPk(pdfId);
};

const removeFileFromDisk = async (relativeUrl) => {
    if (!relativeUrl) return;

    const filePath = path.join(__dirname, '..', relativeUrl);
    try {
        await fs.unlink(filePath);
    } catch (err) {
        console.error('Ошибка при удалении PDF-файла:', err);
    }
};

exports.getElectionPdfs = async (req, res) => {
    try {
        const pdfs = await ElectionPdf.findAll({
            order: [
                ['sortOrder', 'ASC'],
                ['id', 'ASC'],
            ],
        });

        res.status(200).json(pdfs.map(formatPdfResponse));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.createElectionPdf = async (req, res) => {
    try {
        const pdfFile = req.file;

        if (!pdfFile) {
            return res.status(400).json({ error: 'PDF-файл обязателен' });
        }

        const pdfCount = await ElectionPdf.count();

        if (pdfCount >= MAX_ELECTION_PDFS) {
            await removeFileFromDisk(
                posix.join('uploads', 'elections', pdfFile.filename),
            );
            return res.status(400).json({
                error: `Можно загрузить не более ${MAX_ELECTION_PDFS} PDF-файлов`,
            });
        }

        const requestedTitle = req.body.title?.trim();
        const title =
            requestedTitle || getPdfTitleFromFilename(pdfFile.originalname);
        const pdfUrl = posix.join('uploads', 'elections', pdfFile.filename);
        const sortOrder = await getNextSortOrder();

        const newPdf = await ElectionPdf.create({
            title,
            sortOrder,
            url: pdfUrl,
            originalFilename: pdfFile.originalname,
        });

        res.status(201).json(formatPdfResponse(newPdf));
    } catch (error) {
        if (req.file) {
            await removeFileFromDisk(
                posix.join('uploads', 'elections', req.file.filename),
            );
        }
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.uploadOrReplacePdf = async (req, res) => {
    try {
        const pdf = await findPdfById(req.params.id);

        if (!pdf) {
            if (req.file) {
                await removeFileFromDisk(
                    posix.join('uploads', 'elections', req.file.filename),
                );
            }
            return res.status(404).json({ error: 'PDF-файл не найден' });
        }

        const pdfFile = req.file;

        if (!pdfFile) {
            return res.status(400).json({ error: 'PDF-файл обязателен' });
        }

        const pdfUrl = posix.join('uploads', 'elections', pdfFile.filename);
        const requestedTitle = req.body.title?.trim();

        await removeFileFromDisk(pdf.url);
        pdf.url = pdfUrl;
        pdf.originalFilename = pdfFile.originalname;

        if (requestedTitle) {
            pdf.title = requestedTitle;
        }

        await pdf.save();
        res.status(200).json(formatPdfResponse(pdf));
    } catch (error) {
        if (req.file) {
            await removeFileFromDisk(
                posix.join('uploads', 'elections', req.file.filename),
            );
        }
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.updateElectionPdfTitle = async (req, res) => {
    try {
        const pdf = await findPdfById(req.params.id);

        if (!pdf) {
            return res.status(404).json({ error: 'PDF-файл не найден' });
        }

        const title = req.body.title?.trim();

        if (!title) {
            return res.status(400).json({ error: 'Название документа обязательно' });
        }

        pdf.title = title;
        await pdf.save();

        res.status(200).json(formatPdfResponse(pdf));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.deletePdf = async (req, res) => {
    try {
        const pdf = await findPdfById(req.params.id);

        if (!pdf) {
            return res.status(404).json({ error: 'PDF-файл не найден' });
        }

        await removeFileFromDisk(pdf.url);
        await pdf.destroy();

        res.status(200).json({
            message: 'PDF-файл успешно удалён',
            id: pdf.id,
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

const formatBannerResponse = (banner) => ({
    id: banner.id,
    title: banner.title,
    isVisible: banner.isVisible,
    originalFilename: banner.originalFilename,
    url: banner.url ? `${baseUrl}/${banner.url}` : null,
    updatedAt: banner.updatedAt,
});

const getDefaultBannerResponse = () => ({
    id: null,
    title: DEFAULT_BANNER_TITLE,
    isVisible: false,
    originalFilename: null,
    url: null,
    updatedAt: null,
});

const findCurrentBanner = () =>
    ElectionBanner.findOne({
        order: [['updatedAt', 'DESC']],
    });

exports.getCurrentBanner = async (req, res) => {
    try {
        const banner = await findCurrentBanner();

        if (!banner) {
            return res.status(200).json(getDefaultBannerResponse());
        }

        res.status(200).json(formatBannerResponse(banner));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.updateBannerSettings = async (req, res) => {
    try {
        const { title, isVisible } = req.body;
        let banner = await findCurrentBanner();

        if (!banner) {
            banner = await ElectionBanner.create({
                title: title ?? DEFAULT_BANNER_TITLE,
                isVisible: isVisible ?? false,
            });
            return res.status(201).json(formatBannerResponse(banner));
        }

        if (title !== undefined) {
            banner.title = title;
        }
        if (isVisible !== undefined) {
            banner.isVisible = isVisible;
        }

        await banner.save();
        res.status(200).json(formatBannerResponse(banner));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.uploadOrReplaceBanner = async (req, res) => {
    try {
        const bannerFile = req.file;

        if (!bannerFile) {
            return res.status(400).json({ error: 'Изображение баннера обязательно' });
        }

        const bannerUrl = posix.join(
            'uploads',
            'elections',
            'banners',
            bannerFile.filename,
        );

        let banner = await findCurrentBanner();
        const requestedVisibility = parseBooleanField(req.body.isVisible);
        const requestedTitle = req.body.title?.trim();

        if (banner) {
            if (banner.url) {
                await removeFileFromDisk(banner.url);
            }
            banner.url = bannerUrl;
            banner.originalFilename = bannerFile.originalname;
            if (requestedTitle) {
                banner.title = requestedTitle;
            }
            if (requestedVisibility !== undefined) {
                banner.isVisible = requestedVisibility;
            }
            await banner.save();
            return res.status(200).json(formatBannerResponse(banner));
        }

        banner = await ElectionBanner.create({
            url: bannerUrl,
            originalFilename: bannerFile.originalname,
            title: requestedTitle || DEFAULT_BANNER_TITLE,
            isVisible: requestedVisibility !== undefined ? requestedVisibility : true,
        });

        res.status(201).json(formatBannerResponse(banner));
    } catch (error) {
        if (req.file) {
            await removeFileFromDisk(
                posix.join(
                    'uploads',
                    'elections',
                    'banners',
                    req.file.filename,
                ),
            );
        }
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.deleteBannerImage = async (req, res) => {
    try {
        const banner = await findCurrentBanner();

        if (!banner || !banner.url) {
            return res.status(404).json({ error: 'Изображение баннера не найдено' });
        }

        await removeFileFromDisk(banner.url);
        banner.url = null;
        banner.originalFilename = null;
        await banner.save();

        res.status(200).json(formatBannerResponse(banner));
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};
