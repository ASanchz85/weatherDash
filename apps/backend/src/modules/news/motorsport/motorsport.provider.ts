import { defineRssSource } from '../news.rss.js';
import { adaptMotorsportItems } from './motorsport.adapter.js';

const motorsport = defineRssSource({ arrayTags: ['category', 'enclosure'], adapt: adaptMotorsportItems });

export const parseMotorsportFeed = motorsport.parseFeed;
export const createMotorsportProvider = motorsport.createProvider;
