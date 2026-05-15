import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/posts.dto';
import sanitizeHtml from 'sanitize-html';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private cloudflareAi: CloudflareAiService,
  ) {}

  async findAll(query: QueryPostDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.authorId) where.authorId = query.authorId;
    if (query.tagId) {
      where.tags = { some: { tagId: query.tagId } };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
          category: true,
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts.map(p => ({
        ...p,
        tags: p.tags.map(pt => pt.tag),
        commentCount: p._count.comments,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
        comments: {
          where: { status: 'approved' },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
        comments: {
          where: { status: 'approved' },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    // Increment view count
    await this.prisma.post.update({ where: { id: post.id }, data: { viewCount: post.viewCount + 1 } });

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    };
  }

  private sanitize(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'pre', 'code', 'span', 'div', 'del', 'ins', 'mark', 'sub', 'sup']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['style', 'class', 'id'],
        'img': ['src', 'alt', 'width', 'height', 'class'],
        'a': ['href', 'target', 'rel', 'class'],
        'code': ['class'],
        'pre': ['class'],
      },
      allowedSchemes: ['http', 'https', 'data'],
    });
  }

  async create(dto: CreatePostDto, authorId: number) {
    const slug = dto.slug || slugify(dto.title);
    const cleanContent = dto.content ? this.sanitize(dto.content) : '';

    let featuredImage = dto.featuredImage || '';

    // Auto-generate cover image via AI when publishing without one
    if (!featuredImage && dto.status === 'published') {
      const prompt = this.cloudflareAi.buildCoverPrompt(dto.title, dto.excerpt);
      const coverUrl = await this.cloudflareAi.generateCover(prompt);
      if (coverUrl) featuredImage = coverUrl;
    }

    const data: any = {
      title: dto.title,
      slug,
      content: cleanContent,
      excerpt: dto.excerpt || '',
      featuredImage,
      status: dto.status || 'draft',
      authorId,
    };

    if (dto.categoryId) data.categoryId = dto.categoryId;

    if (dto.status === 'published') {
      data.publishedAt = new Date();
    }

    const post = await this.prisma.post.create({ data });

    if (dto.tagIds && dto.tagIds.length > 0) {
      await this.prisma.postTag.createMany({
        data: dto.tagIds.map(tagId => ({ postId: post.id, tagId })),
      });
    }

    return this.findOne(post.id);
  }

  async update(id: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    const data: any = { ...dto };
    delete data.tagIds;
    if (data.content) data.content = this.sanitize(data.content);

    if (dto.slug) data.slug = dto.slug;

    // Auto-generate cover image when publishing without one
    if (!dto.featuredImage && !post.featuredImage && dto.status === 'published') {
      const prompt = this.cloudflareAi.buildCoverPrompt(dto.title || post.title, dto.excerpt || post.excerpt);
      const coverUrl = await this.cloudflareAi.generateCover(prompt);
      if (coverUrl) data.featuredImage = coverUrl;
    }

    if (dto.status === 'published' && post.status !== 'published') {
      data.publishedAt = new Date();
    }

    await this.prisma.post.update({ where: { id }, data });

    if (dto.tagIds !== undefined) {
      await this.prisma.postTag.deleteMany({ where: { postId: id } });
      if (dto.tagIds.length > 0) {
        await this.prisma.postTag.createMany({
          data: dto.tagIds.map(tagId => ({ postId: id, tagId })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted' };
  }
}
