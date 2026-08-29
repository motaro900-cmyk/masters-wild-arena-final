/**
 * @owner: @Motaro900 / Frontend & Backend Team
 * @purpose: VPS-powered MailService with zero Firebase dependencies.
 */

type TrackFn = (unsub: () => void) => () => void;

let mailPollingInterval: any = null;

export async function sendMail(_userId: string, _mailData: any): Promise<void> {
    // Mail sending handled server-side
}

export async function updateMail(_userId: string, _mailId: string, _updates: Partial<any>): Promise<void> {
    // Mail updating handled server-side
}

export async function deleteMail(_userId: string, _mailId: string): Promise<void> {
    // Mail deletion handled server-side
}

export async function updateMultipleMails(_userId: string, _mailIds: string[], _updates: Partial<any>): Promise<void> {
    // Batch updating handled server-side
}

export function subscribeToMail(track: TrackFn, userId: string, callback: (mails: any[]) => void): () => void {
    let active = true;

    const fetchMail = async () => {
        if (!active) return;
        try {
            const launchParams = typeof window !== 'undefined' ? window.location.search : '';
            const res = await fetch(`/api/mail/inbox?userId=${encodeURIComponent(userId)}&launchParams=${encodeURIComponent(launchParams)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.ok && Array.isArray(data.mail)) {
                    callback(data.mail);
                }
            }
        } catch {
            // Quiet network fallback for offline mode
        }
    };

    fetchMail();
    mailPollingInterval = setInterval(fetchMail, 15000); // Check mail every 15s

    const unsubscribe = () => {
        active = false;
        if (mailPollingInterval) {
            clearInterval(mailPollingInterval);
            mailPollingInterval = null;
        }
    };

    return track(unsubscribe);
}
