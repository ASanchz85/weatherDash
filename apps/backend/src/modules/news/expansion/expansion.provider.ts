import { defineRssSource } from '../news.rss.js';
import { adaptExpansionItems } from './expansion.adapter.js';

const expansion = defineRssSource({ arrayTags: ['category', 'media:content'], adapt: adaptExpansionItems });

export const parseExpansionFeed = expansion.parseFeed;
export const createExpansionProvider = expansion.createProvider;
