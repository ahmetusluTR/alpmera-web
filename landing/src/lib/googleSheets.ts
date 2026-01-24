// Google Sheets Integration with Spam Protection (via backend proxy)

interface EarlyAccessData {
  email: string;
  interests?: string[];
  notes?: string;
  notify?: boolean;
  turnstileToken?: string;
  website?: string; // Honeypot
}

interface DemandSuggestionData {
  product_name: string;
  sku?: string;
  reference_url?: string;
  reason?: string;
  city?: string;
  state?: string;
  email?: string;
  notify?: boolean;
  turnstileToken?: string;
  website?: string; // Honeypot
}

interface SubmissionResult {
  success: boolean;
  error?: string;
}

export async function submitEarlyAccess(data: EarlyAccessData): Promise<SubmissionResult> {
  try {
    const payload = {
      sheet: 'Early Access',
      email: data.email,
      interests: data.interests?.join(', ') || '',
      notes: data.notes || '',
      notify: data.notify || false,
      source: 'landing',
      turnstileToken: data.turnstileToken,
      website: data.website,
    };

    const response = await fetch('/api/landing/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function submitDemandSuggestion(data: DemandSuggestionData): Promise<SubmissionResult> {
  try {
    const payload = {
      sheet: 'Demand Suggestions',
      product_name: data.product_name,
      sku: data.sku || '',
      reference_url: data.reference_url || '',
      reason: data.reason || '',
      city: data.city || '',
      state: data.state || '',
      email: data.email || '',
      notify: data.notify || false,
      turnstileToken: data.turnstileToken,
      website: data.website,
    };

    const response = await fetch('/api/landing/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}
