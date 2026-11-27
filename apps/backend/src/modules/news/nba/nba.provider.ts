import { defineRssSource } from '../news.rss.js';
import { adaptNbaItems } from './nba.adapter.js';

const nba = defineRssSource({ arrayTags: ['category', 'enclosure'], adapt: adaptNbaItems });

export const parseNbaFeed = nba.parseFeed;
export const createNbaProvider = nba.createProvider;
