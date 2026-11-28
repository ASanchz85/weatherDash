import { defineRssSource } from '../news.rss.js';
import { adaptEuropaPressItems } from './europa-press.adapter.js';

const europaPress = defineRssSource({ adapt: adaptEuropaPressItems });

export const parseEuropaPressFeed = europaPress.parseFeed;
export const createEuropaPressProvider = europaPress.createProvider;
