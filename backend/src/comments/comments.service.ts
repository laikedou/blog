import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByPost(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId, status: 'approved', parentId: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          post: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateCommentDto, authorId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: dto.postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId: dto.postId,
        authorId,
        parentId: dto.parentId || null,
        status: 'approved',
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
  }

  async update(id: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.comment.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.prisma.comment.delete({ where: { id } });
    return { message: 'Comment deleted' };
  }
}
