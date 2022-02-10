import { useState, useCallback } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({
  postsPagination: { next_page, results },
}: HomeProps) {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function getMorePosts(): Promise<void> {
    const response = await (await fetch(nextPage)).json();
    setPosts([...posts, ...response.results]);
    setNextPage(response.next_page);
  }

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>
      <div className={commonStyles.container}>
        <div className={commonStyles.logo}>
          <img src="/images/logo.svg" alt="logo" />
        </div>
        <main className={styles.postContainer}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <div className={styles.post}>
                <h2>{post.data.title}</h2>
                <span>{post.data.subtitle}</span>
                <div className={commonStyles.info}>
                  <p>
                    <FiCalendar />
                    {format(new Date(post.first_publication_date), 'd MMM y', {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </main>
        {nextPage && (
          <div className={styles.morePosts}>
            <button type="button" onClick={getMorePosts}>
              Carregar mais posts
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'publication')],
    { pageSize: 4 }
  );

  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
