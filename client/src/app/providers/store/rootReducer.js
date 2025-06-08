import { combineReducers } from 'redux';

import authorReducer from '@entities/authors/model/authorSlice';
import categoryReducer from '@entities/categories/model/categorySlice.js';
import newsReducer from '@entities/news/model/newsSlice.js';
import scheduledNewsReducer from '@entities/news/model/scheduledNewsSlice.js';
import searchReducer from '@features/search/model/searchSlice';
import videoSliderReducer from '@entities/videos/model/videoSliderSlice.js';
import commentReducer from '@entities/comments/model/commentsSlice.js';
import authReducer from '@entities/user/auth/model/authSlice.js';
import radioReducer from '@entities/radio/model/radioSlice.js';
import tvProgramReducer from '@entities/tvProgram/model/tvProgramSlice.js';
import videoAdReducer from '@entities/videoAd/model/videoAdSlice.js';
import projectsReducer from '@entities/projects/model/projectSlice.js';
import errorReducer from './errorSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    authors: authorReducer,
    categories: categoryReducer,
    comments: commentReducer,
    news: newsReducer,
    scheduledNews: scheduledNewsReducer,
    search: searchReducer,
    videoSlider: videoSliderReducer,
    radio: radioReducer,
    tvProgram: tvProgramReducer,
    videoAd: videoAdReducer,
    projects: projectsReducer,
    error: errorReducer,
});

export default rootReducer;
