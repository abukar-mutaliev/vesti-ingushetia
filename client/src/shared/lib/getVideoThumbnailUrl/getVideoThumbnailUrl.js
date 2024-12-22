export const getVideoThumbnailUrl = (videoUrl) => {
    if (!videoUrl) return null;

    const youtubeMatch = videoUrl.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    );
    if (youtubeMatch && youtubeMatch[1]) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
    }

    const rutubeMatch = videoUrl.match(
        /(?:https?:\/\/)?(?:www\.)?rutube\.ru\/video\/([\w-]+)/,
    );
    if (rutubeMatch && rutubeMatch[1]) {
        return `https://rutube.ru/api/video/${rutubeMatch[1]}/thumbnail/?redirect=1`;
    }

    return null;
};
