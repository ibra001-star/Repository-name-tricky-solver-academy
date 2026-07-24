import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const listPublishedPosts = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where: { isPublished: true } }),
  ]);

  return { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getPostBySlug = async (slug: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  if (!post || !post.isPublished) throw AppError.notFound('Blog post not found');
  return post;
};

export const listAllPostsForAdmin = async () => {
  return prisma.blogPost.findMany({
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const createPost = async (
  authorId: string,
  input: { title: string; excerpt: string; content: string; coverImageUrl?: string }
) => {
  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  let suffix = 1;

  // Guard against slug collisions from similarly-titled posts.
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return prisma.blogPost.create({
    data: { ...input, slug, authorId },
  });
};

export const updatePost = async (
  postId: string,
  input: Partial<{ title: string; excerpt: string; content: string; coverImageUrl: string; isPublished: boolean }>
) => {
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw AppError.notFound('Blog post not found');

  const data: typeof input & { publishedAt?: Date } = { ...input };
  // Stamp publishedAt the first time a post transitions to published.
  if (input.isPublished && !post.isPublished) {
    data.publishedAt = new Date();
  }

  return prisma.blogPost.update({ where: { id: postId }, data });
};

export const deletePost = async (postId: string) => {
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw AppError.notFound('Blog post not found');
  await prisma.blogPost.delete({ where: { id: postId } });
};
