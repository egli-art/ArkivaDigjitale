// src/app/chat/chat.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {FormsModule} from "@angular/forms";
import {NgClass, NgIf} from "@angular/common";

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [FormsModule, NgClass, NgIf],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
    showChat = false;
    userMessage = '';
    messages: { role: 'user' | 'ai', content: string }[] = [];

    constructor(private http: HttpClient) {}

    toggleChat() {
        this.showChat = !this.showChat;
    }

    async sendMessage() {
        if (!this.userMessage.trim()) return;

        const msg = this.userMessage;
        this.messages.push({ role: 'user', content: msg });
        this.userMessage = '';

        const response = await this.getAIResponse(msg);
        this.messages.push({ role: 'ai', content: response });
    }

    getAIResponse(message: string) {
        return new Promise<string>((resolve) => {
            this.http.post('http://localhost:3000/ai-chat', { message }).subscribe({
                next: (res: any) => resolve(res?.reply || 'AI nuk dha përgjigje.'),
                error: (err) => {
                    console.error(err);
                    resolve('Gabim: nuk mund të lidhet me AI');
                }
            });
        });
    }
}
