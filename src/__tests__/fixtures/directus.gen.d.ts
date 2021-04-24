export interface Article {
  article_id: string;
  title: string;
  body: string;
  publish_date?: string;
}

export interface ArticleAuthor {
  article_id: string;
  author_email: string;
}

export interface Author {
  email: string;
  first_name: string;
  last_name: string;
}

export type MyCollections = {
  articles: Article;
  article_authors: ArticleAuthor;
  authors: Author;
};
