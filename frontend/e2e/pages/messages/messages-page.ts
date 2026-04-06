import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class MessagesPage {
  readonly page: Page;
  readonly conversationList: Locator;
  readonly chatWindow: Locator;
  readonly messageInput: Locator;
  readonly sendBtn: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.conversationList = page.locator('[data-testid="conversation-list"], [role="list"]').first();
    this.chatWindow = page.locator('[data-testid="chat-window"], [role="log"]').first();
    this.messageInput = page.locator('[data-testid="input-message"], textarea[name="message"], input[name="message"]').first();
    this.sendBtn = page.locator('[data-testid="btn-send"], button[type="submit"]').first();
    this.searchInput = page.locator('[data-testid="input-search"], input[placeholder*="buscar"]').first();
  }

  async goto() {
    await this.page.goto('/es/messages');
    await this.page.waitForLoadState('networkidle');
    await this.conversationList.waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectConversation(name: string) {
    await this.conversationList.locator(`:text("${name}")`).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchConversations(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async expectMessageInChat(message: string) {
    const msg = this.chatWindow.locator(`:text("${message}")`).first();
    await expect(msg).toBeVisible();
  }

  async getLastMessage() {
    return await this.chatWindow.locator('[data-testid="message"]').last().textContent();
  }
}