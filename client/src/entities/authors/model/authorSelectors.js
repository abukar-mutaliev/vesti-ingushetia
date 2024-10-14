import { createSelector } from 'reselect';

export const selectAuthor = (state) => state.authors.author;
export const selectAuthors = (state) => state.authors.authors;
const newsByAuthor = (state) => state.authors.newsByAuthor;

export const selectAuthorLoading = (state) => state.authors.loading;

export const selectAuthorError = (state) => state.authors.error;

export const selectNewsByAuthor = createSelector(
    [newsByAuthor, selectAuthor],
    (newsList, author) => {
        return newsList.filter((news) => news.authorId === author.id);
    },
);
