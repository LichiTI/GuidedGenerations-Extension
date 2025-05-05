# SillyTavern 指导生成扩展 (Guided Generations Extension)

本扩展将原版 "Guided Generations" Quick Reply (QR) 功能集的强大能力带到了 SillyTavern，作为一个原生扩展。它提供模块化、具备上下文感知能力的工具，用于塑造、优化和指导 AI 的响应——非常适合角色扮演、故事创作和角色驱动的聊天。所有功能都可以通过集成到 SillyTavern UI 中的直观按钮和菜单进行访问。

代码级文档请参阅 [`JSDoc.md`](./JSDoc.md)。

---

## 目录
- [功能](#功能)
- [安装](#安装)
- [使用](#使用)
- [设置](#⚙️-设置)
- [故障排除](#故障排除)
- [许可证](#许可证)
- [贡献](#贡献)

---

## 功能

### 🐕 指导响应 (Guided Response)
*在 AI 回复前注入指令。*
- 输入指令并按下 🐕。
- 你的指令将指导 AI 的下一次响应。
- [视频示例](https://youtube.com/shorts/yxdtbF3NxW4?feature=share)

### 👈 指导回复 (Guided Swipe)
*使用新的指引重新生成上一条 AI 消息。*
- 输入新的指令并按下 👈 来生成一个新的滑动回复。
- 仅当最后一条消息来自 AI 时可用。
- [视频示例](https://youtube.com/shorts/GRQ9l_8K6-Y?feature=share)

### 扮演 (第一人称: 👤, 第二人称: 👥, 第三人称: 🗣️) (Impersonation)
*将大纲扩展为丰富的、符合角色身份的叙述。*
- 输入简短大纲，选择视角（可在设置中切换），然后按下相应的按钮 (👤/👥/🗣️)。
- 你的大纲将从所选视角扩展为完整的消息。
- 可根据设置单独隐藏或显示。默认显示第一人称。
- 视频示例:
  - [第一人称](https://youtube.com/shorts/FT5gv3d2kE4?feature=share)
  - [第二人称](https://youtube.com/shorts/80l12LrtBpQ?feature=share)
  - [第三人称](https://youtube.com/shorts/wWka-1URLPg?feature=share)

### 📖 持久化指导菜单 (Persistent Guides Menu)
*管理持久化的场景上下文。*
- 点击 📖 按钮打开持久化指导菜单。
- 选择一种指导类型（见下文）来生成或管理上下文。

**指导类型:**
  - 🗺️ 情景 (Situational): 从最近的聊天或用户关注点生成上下文。
  - 🧠 思考 (Thinking): 生成角色想法（自动触发可选）。
  - 👕 衣物 (Clothes): 描述角色服装（自动触发可选）。
  - 🧍 状态 (State): 详细说明角色位置/状态（自动触发可选）。
  - 📜 规则 (Rules): 定义或更新故事内的规则。
  - ➕ 自定义 (Custom): 注入用户定义的上下文。

**管理操作:**
  - ✏️ 编辑指导 (Edit Guides): 通过弹出窗口修改现有的指导注入。
  - 👁️ 显示指导 (Show Guides): 显示所有活动的指导。
  - 🗑️ 清除指导 (Flush Guides): 移除选定或所有指导。
- 思考、衣物和状态的自动触发可以在设置中切换。

### 🔖 工具菜单 (Tools Menu)
*访问额外的实用工具*
  - **🔧 修正内容 (Corrections):** 使用有针对性的指令编辑上一条 AI 消息。
  - **✅ 拼写检查 (Spellchecker):** 润色你的输入，修正语法、标点和流畅度。
  - **✈️ 简单发送 (Simple Send):** 将输入作为用户消息发送，不触发模型响应。
  - **🖋️ 编辑介绍 (Edit Intros):** 按需重写或转换介绍性消息。
  - **↩️ 恢复输入 (Input Recovery):** 恢复之前清除的输入。

---

## 安装

1.  **安装扩展:**
   - 在扩展管理器中，点击"安装扩展"并输入 https://github.com/Samueras/GuidedGenerations-Extension/ 作为 GITHUB 地址。


---

## 使用

- 所有主要功能都显示为发送按钮旁边的按钮，或在左侧的齿轮菜单中。
- 鼠标悬停提示和上下文菜单提供指导和快速访问高级功能。
- 查看应用内设置以了解功能切换和自动指导配置。
- 有关完整的技术细节，请参阅 [`JSDoc.md`](./JSDoc.md)。

---

## ⚙️ 设置

所有扩展设置都通过 SillyTavern 的扩展设置面板进行管理：

- **自动触发 (Auto-Trigger)**: 切换以下功能的自动执行：
  - 思考指导 (Thinking Guide)
  - 状态指导 (State Guide)
  - 衣物指导 (Clothes Guide)

- **按钮可见性 (Buttons Visibility)**: 显示或隐藏操作按钮：
  - 第一人称扮演 (👤)
  - 第二人称扮演 (👥)
  - 第三人称扮演 (🗣️)
  - 指导响应 (🐕)
  - 指导回复 (👈)
  - 持久化指导菜单 (📖)

- **注入角色 (Injection Role)**: 选择注入指令时使用的角色（`system`, `assistant`, 或 `user`）。

- **预设 (Presets)**: 为每个指导/工具（衣物、状态、思考、情景、规则、自定义、修正内容、拼写检查、编辑介绍、扮演 1st/2nd/3rd）选择任何 SillyTavern 预设。在运行指导/工具之前，扩展将切换到该预设（及其配置的 API/模型），执行操作，然后恢复您之前的预设——允许每个指导使用不同的模型。

- **提示词覆盖 (Prompt Overrides)**: 自定义每个指导/工具的原始提示词模板。使用 `{{input}}` 代表您的输入文本，并支持其他占位符。覆盖适用于：
  - 衣物指导提示词
  - 状态指导提示词
  - 思考指导提示词
  - 情景指导提示词
  - 规则指导提示词
  - 修正内容提示词
  - 拼写检查提示词
  - 扮演 第一/二/三人称 提示词
  - 指导响应提示词
  - 指导回复提示词

---

## 故障排除

- **按钮丢失:** 确保 SillyTavern 已更新至最新版本 (v1.12.9+) 并且 LALib 已安装/启用。
- **上下文菜单未出现:** 尝试切换聊天或在 Quick Replies 菜单中重新添加扩展。
- **其他问题:** 重启 SillyTavern，检查更新，并查阅 [SillyTavern 文档](https://github.com/SillyTavern/SillyTavern)。

---

## 许可证

本项目根据 GNU General Public License v3.0 许可证授权。详情请参阅 [LICENSE](LICENSE) 文件。

---

## 贡献

欢迎贡献！提交拉取请求或为改进、功能或文档提出问题。如有疑问或反馈，请在此存储库中提出问题。

---
