const extractVkVideoIds = (videoUrl) => {
    try {
        const url = new URL(videoUrl);
        const oid = url.searchParams.get('oid');
        const id = url.searchParams.get('id');

        if (oid && id) {
            return { oid, id };
        }

        const zParam = url.searchParams.get('z');
        const zMatch = zParam?.match(/video(-?\d+)_(\d+)/i);
        if (zMatch) {
            return { oid: zMatch[1], id: zMatch[2] };
        }

        const pathMatch = url.pathname.match(/(?:video|clip)(-?\d+)_(\d+)/i);
        if (pathMatch) {
            return { oid: pathMatch[1], id: pathMatch[2] };
        }
    } catch {
        const fallbackMatch = videoUrl.match(
            /(?:oid=)?(-?\d+).*?(?:id=|video|clip)(\d+)/i,
        );

        if (fallbackMatch) {
            return { oid: fallbackMatch[1], id: fallbackMatch[2] };
        }
    }

    return null;
};

export const getVideoThumbnailUrl = (videoUrl) => {
    if (!videoUrl) return null;

    const fallbackApiBaseUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
    const apiBaseUrl = (
        import.meta.env?.VITE_API_URL || fallbackApiBaseUrl
    ).replace(/\/$/, '');

    const youtubeMatch = videoUrl.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    );
    if (youtubeMatch && youtubeMatch[1]) {
        return {
            highQuality: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
            fallback: `https://img.youtube.com/vi/${youtubeMatch[1]}/sddefault.jpg`
        };
    }

    const rutubeMatch = videoUrl.match(
        /(?:https?:\/\/)?(?:www\.)?rutube\.ru\/video\/([\w-]+)/,
    );
    if (rutubeMatch && rutubeMatch[1]) {
        return {
            highQuality: `${apiBaseUrl}/media/video-thumbnail/rutube/${rutubeMatch[1]}`,
            fallback: `${apiBaseUrl}/media/video-thumbnail/rutube/${rutubeMatch[1]}`,
        };
    }

    const vkVideo = extractVkVideoIds(videoUrl);
    if (vkVideo) {
        return {
            highQuality: `${apiBaseUrl}/media/video-thumbnail/vk/${vkVideo.oid}/${vkVideo.id}`,
            fallback: `${apiBaseUrl}/media/video-thumbnail/vk/${vkVideo.oid}/${vkVideo.id}`,
        };
    }

    return null;
};