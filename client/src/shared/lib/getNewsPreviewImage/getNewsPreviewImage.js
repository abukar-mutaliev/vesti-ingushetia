export const getNewsPreviewImage = (mediaFiles) => {
    const files = Array.isArray(mediaFiles) ? mediaFiles : [];

    return (
        files.find((media) => media?.type === 'preview' && media.url) ||
        files.find((media) => media?.type === 'image' && media.url) ||
        null
    );
};
