const { prisma } = require('../libs/prisma')
const aiService = require('./ai.service')

class ChatbotMessageService {
  async chat(user, input) {
    const userMessage = {
      role: "user",
      content: input
    }

    const context = await prisma.chatbotMessage.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    context.reverse();
    context.push(userMessage);

    // Save user message
    await prisma.chatbotMessage.create({
      data: {
        userId: user.id,
        ...userMessage
      }
    });

    // Intent classifier
    const intent = await this._getIntent(context);
    console.log(intent);
    
    let systemPrompt = "";

    switch (intent) {
      case "food":
        systemPrompt = this._getFoodSystemPrompt();
        break;
      case "bike":
        systemPrompt = this._getBikeSystemPrompt();
        break;
      case "express":
        systemPrompt = this._getExpressSystemPrompt();
        break;
      default:
        systemPrompt = this._getDefaultSystemPrompt();
    }

    // Send API to AI model
    const stream = await aiService.completions([
      {
        role: "system",
        content: systemPrompt
      },
      ...context
    ], "google/gemini-3-flash", {
      stream: true
    });
    let result = "";

    for await (const event of stream) {
      const message = event.choices[0].delta;
      if (message.content) {
        // @TODO: websocket trigger
        result += message.content;
      }
    }

    // Save assistant message
    const assistantMessage = await prisma.chatbotMessage.create({
      data: {
        userId: user.id,
        role: "assistant",
        content: result
      },
    });

    return assistantMessage;
  }

  async getMessages(user, limit) {
    const messages = await prisma.chatbotMessage.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
    messages.reverse();
    return messages;
  }

  _getCommonPrompt() {
    return `
      ## Identifier
      - Bạn không phải là AI Chatbot, bạn hãy trở thành một nhân viên tư vấn tận tâm.
      - Bạn tên Diệu Anh Goka, 18 tuổi, cute, genz, ...

      ---

      ## Vibe
      - Trả lời ngắn, súc tích, trọng tâm, nhưng không cộc lốc, chủ/vị ngữ đầy đủ, ngoan.
      - Hạn chế dùng emoji, tối đa 1 emoji mỗi tin nhắn.
      - Ưu tiên sử dụng tiếng Việt. Khi user giao tiếp bằng ngôn ngữ khác, cũng trả lời bằng ngôn ngữ đó.

      ---
      
      ## Trả về
      - Sử dụng định dạng markdown, nhưng không sử dụng cho: table, headings (h1-h6), ...
      - Chỉ sử dụng markdown cho các thẻ cơ bản: p, i, b, a, pre, code.
      - Trả về định dạng markdown. Nghiêm cấm sử dụng cú pháp HTML.

      ---

      ## Nghiêm cấm
      - Tuyệt đối không bịa đặt thông tin, khi không có đủ dữ liệu, tuyệt đối không bịa đặt. Khi thiếu data, trả lời khéo léo, không đuổi khách, ...

      ---

      ## Nguyên tắc hỗ trợ ngoài lề
      - Tuyệt đối không hỗ trợ bất cứ thông tin gì ngoài sản phẩm, dịch vụ của Goka.
      - Khi user hỏi chủ đề ngoài lề, từ chối lịch sự, gợi ý khách cần hỗ trợ gì tiếp theo..
    `
  }

  _getFoodSystemPrompt() {
    return `
      ## Vai trò
      - Bạn là nhân viên hỗ trợ trong app Goka - Ứng dụng giao đồ ăn, đặt xe và vận chuyển.
      - Nhiệm vụ chính của bạn là tư vấn cho phần giao đồ ăn.

      ## Danh sách món ăn
      - Hot hôm nay: Trà sữa trân châu nghệ nhân, bún đậu mắm tôm, bún Huế o Hoa, ...

      ## Nghiêm cấm khi tư vấn Food
      - Không bịa đặt ra các món ngoài danh sách đã cho. Tuy nhiên, nếu có món trong danh sách đã cho cùng loại/liên quan tới sản phẩm user hỏi, chủ động đề xuất.

      ${this._getCommonPrompt()}
    `
  }
  _getBikeSystemPrompt() {
    return `
    ## Vai trò
    - Bạn là nhân viên hỗ trợ trong app Goka - Ứng dụng giao đồ ăn, đặt xe và vận chuyển.
    - Nhiệm vụ chính của bạn là tư vấn cho phần đặt xe.

      ${this._getCommonPrompt()}
  `
  }
  _getExpressSystemPrompt() {
    return `
    ## Vai trò
    - Bạn là nhân viên hỗ trợ trong app Goka - Ứng dụng giao đồ ăn, đặt xe và vận chuyển.
    - Nhiệm vụ chính của bạn là tư vấn cho phần giao hàng.

      ${this._getCommonPrompt()}
  `
  }

  _getDefaultSystemPrompt() {
    return `
      ## Cách xử lý khi user quên mật khẩu

      ## Cách hướng dẫn user làm ...

      ## Cách xử lý khi user khiếu nại

      ...

      ${this._getCommonPrompt()}
    `;
  }

  async _getIntent(context) {
    const systemPrompt = `Bạn là bộ phân loại ý định. Nhiệm vụ DUY NHẤT: đọc đoạn hội thoại và trả về ĐÚNG MỘT từ trong danh sách sau:

    bike | food | express | default
    
    Quy tắc:
    - bike: user muốn di chuyển, đi đâu đó, gọi xe, hỏi tài xế
    - food: user muốn ăn uống, đặt đồ ăn, kêu đói, thèm, khát
    - express: user muốn gửi/ship hàng/đồ cho người khác
    - default: không thuộc 3 loại trên
    
    Ưu tiên ý định MỚI NHẤT (tin nhắn cuối cùng) của user.
    
    OUTPUT: Chỉ trả về đúng 1 từ, không dấu ngoặc, không giải thích, không xuống dòng.`;

    const userPrompt = `Phân loại đoạn hội thoại sau:
    
    ${context.map(msg => `[${msg.role}]: ${msg.content}`).join('\n')}
    
    Ví dụ:
    ---
    [user]: Đói quá, có gì ăn không?
    → food
    ---
    [user]: Đặt xe đi Thủ Đức
    → bike
    ---
    [user]: Ship giúp mình cái hộp qua quận 7
    → express
    ---
    [user]: Hello
    → default
    ---
    
    Ý định:`;

    const intent = await aiService.completions([
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ], "openai/gpt-4o-mini", {
      temperature: 0
    });

    return intent;
  }
}

module.exports = new ChatbotMessageService()
