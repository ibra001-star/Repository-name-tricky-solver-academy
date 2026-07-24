'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { BlogPostDetail } from '@/types';

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = React.useState<BlogPostDetail | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    api
      .get<{ post: BlogPostDetail }>(`/blog/${params.slug}`)
      .then((d) => setPost(d.post))
      .catch(() => setNotFound(true));
  }, [params.slug]);

  if (notFound) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center text-center">
        <div>
          <h1 className="font-display text-xl font-semibold">Article not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This post may have been removed or unpublished.</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <article className="container max-w-2xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt="" className="mb-6 w-full rounded-2xl object-cover" />
        )}
        <h1 className="font-display text-3xl font-bold">{post.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {post.publishedAt &&
            new Date(post.publishedAt).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          <span>·</span>
          <span>
            {post.author.firstName} {post.author.lastName}
          </span>
        </div>

        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-sm leading-relaxed dark:prose-invert">
          {post.content}
        </div>
      </motion.div>
    </article>
  );
}
