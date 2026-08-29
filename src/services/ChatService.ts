/**
 * @owner: @Motaro900 / Frontend & Backend Team
 * @purpose: VPS-powered ChatService with zero Firebase dependencies and polling fallback.
 */

import { censorText } from '../utils/censor';

type TrackFn = (unsub: () => void) => () => void;

let pollingInterval: any = null;
let lastKnownTimestamp = 0;

export async function sendChatMessage(message: any): Promise<void> {
    try {
        if (message && typeof message.text === 'string') {
            message.text = censorText(message.text);
        }

        const launchParams = typeof window !== 'undefined' ? window.location.search : '';
        const payload = {
            userId: message.authorId || message.senderId || 'DEVELOPER',
            senderName: message.author || message.senderName || 'Игрок',
            text: message.text,
            room: message.room || 'global',
            channel: message.channel || 'player',
            launchParams,
        };

        const res = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            console.warn('[ChatService] Failed to send message via VPS API:', await res.text());
        }
    } catch (error) {
        console.warn('[ChatService] Failed to send chat message:', error);
    }
}

export async function deletePlayerMessages(_playerName: string): Promise<void> {
    // Admin command stub for VPS
}

export async function wipeGlobalChat(): Promise<void> {
    // Admin command stub for VPS
}

export function subscribeToChat(track: TrackFn, callback: (messages: any[]) => void): () => void {
    let active = true;

    const fetchMessages = async () => {
        if (!active) return;
        try {
            const res = await fetch(`/api/chat/messages?room=global&since=${lastKnownTimestamp}`);
            if (res.ok) {
                const data = await res.json();
                if (data.ok && Array.isArray(data.messages)) {
                    if (data.messages.length > 0) {
                        lastKnownTimestamp = Math.max(...data.messages.map((m: any) => m.timestamp || 0));
                    }
                    callback(data.messages);
                }
            }
        } catch {
            // Quiet network fallback for offline mode
        }
    };

    // Initial fetch
    fetchMessages();

    // Poll every 4 seconds
    pollingInterval = setInterval(fetchMessages, 4000);

    const unsubscribe = () => {
        active = false;
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    };

    return track(unsubscribe);
}

export async function sendPrivateMessage(_senderId: string, _recipientId: string, _message: any): Promise<void> {
    // Private message stub
}

export function subscribeToPrivateMessages(track: TrackFn, _userId: string, _callback: (messages: any[]) => void): () => void {
    return track(() => {});
}

export function subscribeToClanChat(track: TrackFn, _clanId: string, _callback: (messages: any[]) => void): () => void {
    return track(() => {});
}
