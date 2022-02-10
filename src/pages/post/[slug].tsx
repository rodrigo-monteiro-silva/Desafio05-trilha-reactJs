import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Header from '../../components/Header';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <p className={styles.fallBack}>Carregando...</p>;
  }

  const average_reading_time = post.data.content.reduce((acc, content) => {
    const textBody = RichText.asText(content.body);
    const split = textBody.split(' ');
    const number_words = split.length;

    console.log(split);

    const result = Math.ceil(number_words / 200);
    return acc + result;
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>
      <Header />
      <div className={commonStyles.slugContainer}>
        <main className={styles.contentContainer}>
          <header>
            <img src={post.data.banner.url} alt={post.data.title} />
          </header>
          <h1>{post.data.title}</h1>
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
            <p>
              <FiClock /> {average_reading_time} min
            </p>
          </div>
          {post.data.content.map(section => (
            <section key={section.heading} className={styles.sectionContent}>
              <h2>{section.heading}</h2>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(section.body),
                }}
              />
            </section>
          ))}
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'publication')],
    { pageSize: 4 }
  );

  const slugsArray = postsResponse.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: slugsArray,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('publication', String(slug), {});

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 5, // 5 minutes
  };
};
