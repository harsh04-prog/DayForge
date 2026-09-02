interface SendPushParams {
  userId: number | string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

export async function sendOneSignalPush({
  userId,
  title,
  message,
  url,
  data,
}: SendPushParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const appId =
    process.env.ONESIGNAL_APP_ID ||
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ||
    '5dc2a447-be3d-4af2-87b6-367347e201ce';

  const restApiKey = process.env.ONESIGNAL_REST_API_KEY || '';
  if (!restApiKey) {
    console.warn('ONESIGNAL_REST_API_KEY environment variable is not configured');
    return { success: false, error: 'ONESIGNAL_REST_API_KEY missing' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://day-forge-alpha.vercel.app';
  const targetUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : `${baseUrl}/habits`;

  const payload = {
    app_id: appId,
    include_aliases: {
      external_id: [String(userId)],
    },
    target_channel: 'push',
    headings: { en: title },
    contents: { en: message },
    url: targetUrl,
    chrome_web_icon: `${baseUrl}/icons/icon-192x192.png`,
    chrome_web_badge: `${baseUrl}/icons/icon-192x192.png`,
    firefox_icon: `${baseUrl}/icons/icon-192x192.png`,
    web_buttons: [
      {
        id: 'open_app',
        text: 'Open DayForge ⚡',
        icon: `${baseUrl}/icons/icon-192x192.png`,
        url: targetUrl,
      },
    ],
    data: data || {},
  };

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.warn('OneSignal push notification response:', result);
      return { success: false, error: result.errors?.[0] || 'Failed to send OneSignal push' };
    }

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error('Error dispatching OneSignal push:', error);
    return { success: false, error: error.message };
  }
}
