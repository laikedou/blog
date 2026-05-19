import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsGateway } from '../common/notifications.gateway';
import { heuristicSpamCheck, aiSpamCheck } from '../common/spam-checker';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async findByPost(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId, status: 'approved', parentId: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, displayName: true, role: true } },
          post: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateCommentDto, authorId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: dto.postId } });
    if (!post) throw new NotFoundException('Post not found');

    const author = await this.prisma.user.findUnique({ where: { id: authorId }, select: { displayName: true } });

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId: dto.postId,
        authorId,
        parentId: dto.parentId || null,
        status: 'approved',
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true, role: true } },
      },
    });

    // Notify parent comment author on reply
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { authorId: true },
      });
      if (parent && parent.authorId !== authorId) {
        this.notifications.notifyCommentReply({
          commentId: comment.id,
          postId: dto.postId,
          replyAuthor: author?.displayName || 'Someone',
          parentAuthorId: parent.authorId,
          snippet: dto.content.substring(0, 100),
        });
      }
    }

    // Async spam check (non-blocking)
    this.runSpamCheck(comment.id, dto.content);

    return comment;
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

  async batchUpdateStatus(ids: number[], status: string) {
    await this.prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return { updated: ids.length };
  }

  private async runSpamCheck(commentId: number, content: string) {
    try {
      const heuristic = heuristicSpamCheck(content);
      if (heuristic.isSpam) {
        await this.prisma.comment.update({ where: { id: commentId }, data: { status: 'spam' } });
        return;
      }
      const ai = await aiSpamCheck(content);
      if (ai.isSpam) {
        await this.prisma.comment.update({ where: { id: commentId }, data: { status: 'pending' } });
      }
    } catch { /* ignore spam check failures */ }
  }

  async toggleLike(commentId: number, userId: number) {
    const existing = await this.prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await this.prisma.commentLike.delete({ where: { id: existing.id } });
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      await this.prisma.commentLike.create({
        data: { commentId, userId },
      });
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      });
      return { liked: true };
    }
  }

  async getLikeStatus(commentId: number, userId: number) {
    const like = await this.prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    return { liked: !!like };
  }
}
