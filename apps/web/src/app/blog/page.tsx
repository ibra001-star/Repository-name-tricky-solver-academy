'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { BlogPostSummary } from '@/types';

export default function BlogPage() {
  const [posts, setPosts] = React.useState<BlogPostSummary[] | null>(null);

  React.useEffect(() => {
    api
      .get<{ posts: BlogPostSummary[] }>('/blog')
      .then((d) => setPosts(d.posts))
      .catch(() => setPosts([]));
  }, []);

  return (
    <div className="container max-w-4xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Blog</h1>
        <p className="mt-1 text-muted-foreground">
          Study tips, exam strategies, and news from Tricky Solver Academy.
        </p>
      </motion.div>

      {posts === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No articles published yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              {post.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImageUrl} alt="" className="h-40 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-semibold">{post.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {post.publishedAt &&
                    new Date(post.publishedAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  <span>·</span>
                  <span>
                    {post.author.firstName} {post.author.lastName}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
