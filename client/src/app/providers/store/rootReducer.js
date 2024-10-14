import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authorReducer from '@entities/authors/model/authorSlice';
import categoryReducer from '@entities/categories/model/categorySlice.js';
import newsReducer from '@entities/news/model/newsSlice.js';
import searchReducer from '@features/search/model/searchSlice';
import videoSliderReducer from '@entities/videos/model/videoSliderSlice.js';
import commentReducer from '@entities/comments/model/commentsSlice.js';
import authReducer from '@entities/user/auth/model/authSlice.js';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['news', 'categories', 'comments', 'authors'],
};

const rootReducer = combineReducers({
    auth: authReducer,
    authors: authorReducer,
    categories: categoryReducer,
    comments: commentReducer,
    news: newsReducer,
    search: searchReducer,
    videoSlider: videoSliderReducer,
});

export default persistReducer(persistConfig, rootReducer);
