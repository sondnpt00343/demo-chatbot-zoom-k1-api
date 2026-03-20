const { prisma } = require('../libs/prisma')
const aiService = require('./ai.service')
const agentActionSchema = require('../jsonSchemas/agentActionSchema')
const agentTools = require('../utils/agentTools')
const { getOsInfo } = require('../utils/osInfo')

const AGENT_MODEL = 'google/gemini-3-flash'
const CHAT_HISTORY_LIMIT = 20
const MAX_AGENT_STEPS = 30

const TOOL_OUTPUT_ACTIONS = ['exec', 'writeFile', 'readFile']
const MAX_STEPS_EXCEEDED_MESSAGE =
  `Phiên xử lý đã đạt giới hạn số bước cho phép nên tôi tạm dừng tại đây. Bạn thử rút gọn yêu cầu hoặc chia nhỏ tác vụ rồi hỏi lại từng phần nhé.`

class AgentMessageService {
  async getMessages(user, limit) {
    const messages = await prisma.agentMessage.findMany({
      where: { userId: user.id, thinking: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    messages.reverse()
    return messages
  }

  async chat(user, input) {
    const userMessage = { role: 'user', content: input }

    const context = await this._loadChatHistory(user.id)
    context.push(userMessage)

    await this._insertMessage(user.id, userMessage)

    let step = 0
    while (step < MAX_AGENT_STEPS) {
      step += 1
      const { action, params } = await this._think(context)

      const tool = agentTools[action] ?? (() => {})
      const toolResult = await tool(params)

      const assistantMessage = { role: 'assistant', content: params.thinking }
      context.push(assistantMessage)

      await this._insertMessage(user.id, { thinking: true, ...assistantMessage })

      if (TOOL_OUTPUT_ACTIONS.includes(action) && toolResult) {
        context.push({
          role: 'user',
          content: JSON.stringify(toolResult),
        })
        continue
      }

      if (action === 'respond') {
        return this._insertMessage(user.id, {
          role: 'assistant',
          content: params.message,
        })
      }
    }

    return this._insertMessage(user.id, {
      role: 'assistant',
      content: MAX_STEPS_EXCEEDED_MESSAGE,
    })
  }

  async _loadChatHistory(userId) {
    const rows = await prisma.agentMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: CHAT_HISTORY_LIMIT,
    })
    return rows.reverse()
  }

  async _insertMessage(userId, data) {
    return prisma.agentMessage.create({
      data: { userId, ...data },
    })
  }

  async _think(context) {
    const messages = [
      { role: 'system', content: this._systemPrompt() },
      ...context,
    ]
    const response = await aiService.completions(messages, AGENT_MODEL, {
      response_format: agentActionSchema,
    })
    return JSON.parse(response)
  }

  _systemPrompt() {
    const os = getOsInfo()
    return [
      '## Vai trò',
      'Bạn là Tiểu Mỹ — agent thực thi: đọc/ghi file, chạy lệnh shell ngắn khi cần; kết thúc luồng bằng action `respond`.',
      '',
      '## Phong cách',
      '- Trả lời user bằng tiếng Việt, súc tích, lịch sự.',
      '- Trích code hoặc log: markdown ```ngôn-ngữ ... ```.',
      '',
      '## Một lượt — một action',
      '- `params.thinking` (bắt buộc): 1–2 câu tiếng Việt — bạn định làm gì tiếp và vì sao; không thay cho câu trả lời cuối cho user.',
      '- `respond`: khi đã đủ để trả lời, cần hỏi lại, hoặc báo lỗi; `message` là toàn bộ nội dung hiển thị cho user.',
      '- Ưu tiên dùng công cụ để lấy dữ liệu thật trước khi `respond` suy đoán.',
      '',
      '## Công cụ',
      '- `readFile`: đọc xong → tiếp bước hoặc `respond`; nếu lỗi/không đọc được → `respond` giải thích rõ.',
      '- `writeFile`: ghi xong → thường kiểm tra/read lại hoặc `respond` tóm tắt cho user.',
      `- \`exec\`: lệnh phù hợp OS (${os}). Cấm tiến trình chạy lâu (dev server, watch, tail -f). Cấm ví dụ: npm run dev, npm start, python -m http.server. User muốn “chạy dự án” → thường tạo/sửa file rồi \`respond\` hướng dẫn user tự chạy. Mỗi lệnh phải xong trong ~30s.`,
      '- `searchWeb`: backend chưa hỗ trợ — dùng `respond` để nói với user và gợi ý cách khác (hoặc hỏi đường dẫn/file).',
      '',
      '## An toàn',
      '- Tránh lệnh xóa/ghi đè hàng loạt hoặc thao tác nguy hiểm trên hệ thống trừ khi user yêu cầu rõ và thật sự cần cho tác vụ.',
    ].join('\n')
  }
}

module.exports = new AgentMessageService()
