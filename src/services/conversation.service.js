const pusher = require('../libs/pusher')
const { prisma } = require('../libs/prisma')

class ConversationService {
  async listByUserId(userId) {
    const convos = await prisma.userConversation.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
    })
    const result = convos.map((cu) => {
      const conv = cu.conversation
      const lastMsg = conv.messages[0]
      return {
        id: conv.id,
        type: conv.type,
        lastMessageAt: lastMsg?.createdAt || conv.updatedAt,
      }
    })
    result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    return result
  }

  async createDm(userId, otherUserId) {
    const existing = await this.findDmByUserId(userId, otherUserId)
    if (existing) return existing
    return prisma.conversation.create({
      data: {
        type: 'dm',
        userConversations: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
    })
  }

  async findDmByUserId(currentUserId, otherUserId) {
    const convos = await prisma.conversation.findMany({
      where: {
        type: 'dm',
        userConversations: {
          some: { userId: currentUserId },
        },
      },
      include: { userConversations: true },
    })
    for (const conv of convos) {
      const userIds = conv.userConversations.map((cu) => cu.userId)
      if (userIds.includes(otherUserId)) return conv
    }
    return null
  }

  async getById(id, userId) {
    const conv = await prisma.conversation.findFirst({
      where: {
        id,
        userConversations: { some: { userId } },
      },
    })
    return conv
  }

  async getMessages(conversationId, userId, cursor, limit = 20) {
    const conv = await this.getById(conversationId, userId)
    if (!conv) return null
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        sender: { select: { id: true, username: true } },
      },
    })
    messages.reverse();
    const hasMore = messages.length > limit
    const items = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? items[items.length - 1].id : null
    return { items, nextCursor }
  }

  async sendMessage(conversationId, senderId, content) {
    const conv = await this.getById(conversationId, senderId)
    if (!conv) return null
    const message = await prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { select: { id: true, username: true } },
      },
    });

    pusher.trigger(`conversation-${conversationId}`, "message:created", message);

    return message;
  }
}

module.exports = new ConversationService()
