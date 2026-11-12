import {
  Agreement,
  AgreementConsensus,
  AgreementHistory,
  AgreementParticipant,
  Ambiguity,
  ConversationAnalysis,
  ConversationDetail,
  FinancialSummary,
  InvitationDetailsResponse,
  PaginatedConversations,
  ParticipantInvitationResponse,
  WhatsAppAccount,
  WhatsAppMessage,
  WhatsAppStatus,
} from '../types/accord';
import {
  AgreementSettlementSummary,
  PaymentCapture,
  PaymentHistoryEntry,
  PaymentRefund,
  PaymentRequest,
  PayPalOrder,
} from '../types/payments';

export interface HealthStatus {
  status: string;
  app: string;
  environment: string;
}

export interface ReadinessStatus {
  status: string;
  database: boolean;
  redis: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Resolves the API base URL.
 * In development, defaults to the same-origin relative path '/api/v1'
 * which is automatically forwarded to the backend via Vite's development proxy.
 * If explicitly overridden by VITE_API_BASE_URL, that value is normalized and used.
 */
function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl.trim() === '') {
    return '/api/v1';
  }
  const clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    return `/${clean}`;
  }
  return clean;
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Format structured error response from backend into a clear human-readable ApiError.
 */
export function parseApiError(data: any, status: number, defaultMsg: string): ApiError {
  let message = defaultMsg;

  if (data?.error?.message) {
    message = data.error.message;
    if (Array.isArray(data.error.details) && data.error.details.length > 0) {
      const fieldErrors = data.error.details
        .map((d: any) => {
          const field = Array.isArray(d.loc) ? d.loc.slice(-1)[0] : 'field';
          return `${field}: ${d.msg}`;
        })
        .join('; ');
      message = `${message} (${fieldErrors})`;
    }
  } else if (typeof data?.detail === 'string') {
    message = data.detail;
  } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const fieldErrors = data.detail
      .map((d: any) => {
        const field = Array.isArray(d.loc) ? d.loc.slice(-1)[0] : 'field';
        return `${field}: ${d.msg}`;
      })
      .join('; ');
    message = `Validation error: ${fieldErrors}`;
  }

  return new ApiError(message, status, data);
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw parseApiError(data, response.status, 'Health check failed');
  }
  return response.json();
}

export async function checkReadiness(): Promise<ReadinessStatus> {
  const response = await fetch(`${API_BASE_URL}/ready`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await response.json();
  if (!response.ok && response.status !== 503) {
    throw parseApiError(data, response.status, 'Readiness check failed');
  }
  return data;
}

// ----------------------------------------------------------------------
// Auth Endpoints
// ----------------------------------------------------------------------

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Login failed');
  }
  return data;
}

export async function registerUser(email: string, password: string, fullName: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Registration failed');
  }
  return data;
}

// ----------------------------------------------------------------------
// ACCORD Ingestion Endpoints
// ----------------------------------------------------------------------

export async function ingestPastedText(
  token: string,
  content: string,
  title?: string
): Promise<ConversationDetail> {
  const response = await fetch(`${API_BASE_URL}/accord/conversations/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content,
      title: title && title.trim() ? title.trim() : undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Ingestion failed');
  }
  return data;
}

export async function uploadWhatsAppFile(
  token: string,
  file: File,
  title?: string
): Promise<ConversationDetail> {
  const formData = new FormData();
  formData.append('file', file);
  if (title && title.trim()) {
    formData.append('title', title.trim());
  }

  const response = await fetch(`${API_BASE_URL}/accord/conversations/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'File upload failed');
  }
  return data;
}

export async function listConversations(
  token: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedConversations> {
  const response = await fetch(`${API_BASE_URL}/accord/conversations?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch conversations');
  }
  return data;
}

export async function getConversation(token: string, id: string): Promise<ConversationDetail> {
  const response = await fetch(`${API_BASE_URL}/accord/conversations/${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch conversation');
  }
  return data;
}

export async function deleteConversation(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/accord/conversations/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw parseApiError(data, response.status, 'Failed to delete conversation');
  }
}

// ----------------------------------------------------------------------
// Stage 3 Conversation Intelligence Endpoints
// ----------------------------------------------------------------------

export async function analyzeConversation(
  token: string,
  conversationId: string,
  forceRetry: boolean = false
): Promise<ConversationAnalysis> {
  const url = `${API_BASE_URL}/accord/conversations/${conversationId}/analyze${
    forceRetry ? '?force_retry=true' : ''
  }`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Conversation analysis failed');
  }
  return data;
}

export async function getLatestAnalysis(
  token: string,
  conversationId: string
): Promise<ConversationAnalysis> {
  const response = await fetch(`${API_BASE_URL}/accord/conversations/${conversationId}/analysis`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch latest analysis');
  }
  return data;
}

export async function getAnalysisById(
  token: string,
  analysisId: string
): Promise<ConversationAnalysis> {
  const response = await fetch(`${API_BASE_URL}/accord/analyses/${analysisId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch analysis details');
  }
  return data;
}

export async function getAnalysisAmbiguities(
  token: string,
  analysisId: string
): Promise<Ambiguity[]> {
  const response = await fetch(`${API_BASE_URL}/accord/analyses/${analysisId}/ambiguities`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch ambiguities');
  }
  return data;
}

export async function resolveAmbiguity(
  token: string,
  ambiguityId: string,
  resolution: string
): Promise<Ambiguity> {
  const response = await fetch(`${API_BASE_URL}/accord/ambiguities/${ambiguityId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resolution: resolution.trim() }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to resolve ambiguity');
  }
  return data;
}

export async function updateAgreement(
  token: string,
  agreementId: string,
  payload: { title?: string; summary?: string; terms?: string[] }
): Promise<Agreement> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to update agreement');
  }
  return data;
}

export async function confirmAgreement(
  token: string,
  agreementId: string,
  notes?: string
): Promise<Agreement> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes: notes?.trim() || undefined }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to confirm agreement');
  }
  return data;
}

export async function rejectAgreement(
  token: string,
  agreementId: string,
  rejectionReason: string,
  notes?: string
): Promise<Agreement> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      rejection_reason: rejectionReason.trim(),
      notes: notes?.trim() || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to reject agreement');
  }
  return data;
}

export async function getFinancialSummary(
  token: string,
  conversationId: string
): Promise<FinancialSummary> {
  const response = await fetch(`${API_BASE_URL}/accord/conversations/${conversationId}/financial-summary`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch financial summary');
  }
  return data;
}

export async function submitAgreementForReview(
  token: string,
  agreementId: string
): Promise<AgreementConsensus> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/submit-for-review`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to submit agreement for review');
  }
  return data;
}

export async function getAgreement(
  token: string,
  agreementId: string
): Promise<Agreement> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch agreement details');
  }
  return data;
}

export async function getAgreementConsensus(
  token: string,
  agreementId: string
): Promise<AgreementConsensus> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/consensus`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch agreement consensus');
  }
  return data;
}

export async function respondAsParticipant(
  token: string,
  agreementId: string,
  participantId: string,
  responseValue: 'ACCEPTED' | 'REJECTED' | 'REQUESTED_CHANGES',
  comment?: string
): Promise<AgreementConsensus> {
  const response = await fetch(
    `${API_BASE_URL}/accord/agreements/${agreementId}/participants/${participantId}/respond`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        response: responseValue,
        comment: comment?.trim() || undefined,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to submit participant response');
  }
  return data;
}

export async function confirmAllParticipants(
  token: string,
  agreementId: string
): Promise<AgreementConsensus> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/confirm-all`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to confirm all participants');
  }
  return data;
}

export async function getAgreementHistory(
  token: string,
  agreementId: string
): Promise<AgreementHistory[]> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/history`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch agreement history');
  }
  return data;
}

export async function bindParticipantUser(
  token: string,
  agreementId: string,
  participantId: string,
  payload: { userId?: string; email?: string }
): Promise<AgreementParticipant> {
  const response = await fetch(
    `${API_BASE_URL}/accord/agreements/${agreementId}/participants/${participantId}/bind`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: payload.userId || undefined,
        email: payload.email?.trim() || undefined,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to bind participant to account');
  }
  return data;
}

export async function unbindParticipantUser(
  token: string,
  agreementId: string,
  participantId: string
): Promise<AgreementParticipant> {
  const response = await fetch(
    `${API_BASE_URL}/accord/agreements/${agreementId}/participants/${participantId}/unbind`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to unbind participant');
  }
  return data;
}

export async function createParticipantInvitation(
  token: string,
  agreementId: string,
  participantId: string,
  expiresInHours: number = 48
): Promise<ParticipantInvitationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/accord/agreements/${agreementId}/participants/${participantId}/invite`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        expires_in_hours: expiresInHours,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to generate participant invitation');
  }
  return data;
}

export async function getInvitationDetails(
  tokenStr: string
): Promise<InvitationDetailsResponse> {
  const response = await fetch(`${API_BASE_URL}/accord/invitations/${tokenStr}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to retrieve invitation details');
  }
  return data;
}

export async function acceptInvitation(
  token: string,
  tokenStr: string
): Promise<AgreementConsensus> {
  const response = await fetch(`${API_BASE_URL}/accord/invitations/${tokenStr}/accept`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to accept invitation');
  }
  return data;
}

// =============================================================================
// ACCORD PAYPAL PAYMENTS & SETTLEMENT API CLIENT
// =============================================================================

export async function createPaymentRequest(
  token: string,
  agreementId: string,
  obligationId: string,
  notes?: string
): Promise<PaymentRequest> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ obligation_id: obligationId, notes }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to create payment request');
  }
  return data;
}

export async function listPaymentRequests(
  token: string,
  agreementId: string
): Promise<PaymentRequest[]> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/payment-requests`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch payment requests');
  }
  return data;
}

export async function getPaymentRequest(
  token: string,
  paymentRequestId: string
): Promise<PaymentRequest> {
  const response = await fetch(`${API_BASE_URL}/accord/payment-requests/${paymentRequestId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to fetch payment request details');
  }
  return data;
}

export async function cancelPaymentRequest(
  token: string,
  paymentRequestId: string,
  reason?: string
): Promise<PaymentRequest> {
  const response = await fetch(`${API_BASE_URL}/accord/payment-requests/${paymentRequestId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to cancel payment request');
  }
  return data;
}

export async function createPayPalOrder(
  token: string,
  paymentRequestId: string
): Promise<PayPalOrder> {
  const response = await fetch(`${API_BASE_URL}/payments/paypal/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payment_request_id: paymentRequestId }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to create PayPal order');
  }
  return data;
}

export async function getPayPalOrder(
  token: string,
  orderId: string
): Promise<PayPalOrder> {
  const response = await fetch(`${API_BASE_URL}/payments/paypal/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to retrieve PayPal order');
  }
  return data;
}

export async function capturePayPalOrder(
  token: string,
  orderId: string
): Promise<PaymentCapture> {
  const response = await fetch(`${API_BASE_URL}/payments/paypal/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to capture PayPal order');
  }
  return data;
}

export async function refundPayPalCapture(
  token: string,
  captureId: string,
  reason?: string,
  amount?: number
): Promise<PaymentRefund> {
  const response = await fetch(`${API_BASE_URL}/payments/paypal/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason, amount }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to refund payment capture');
  }
  return data;
}

export async function getAgreementSettlementSummary(
  token: string,
  agreementId: string
): Promise<AgreementSettlementSummary> {
  const response = await fetch(`${API_BASE_URL}/accord/agreements/${agreementId}/settlement`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to load agreement settlement summary');
  }
  return data;
}

export async function getPaymentRequestHistory(
  token: string,
  paymentRequestId: string
): Promise<PaymentHistoryEntry[]> {
  const response = await fetch(`${API_BASE_URL}/accord/payment-requests/${paymentRequestId}/history`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to load payment history');
  }
  return data;
}

// Stage 5 WhatsApp Business API Client Methods

export async function getWhatsAppStatus(token: string): Promise<WhatsAppStatus> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to get WhatsApp status');
  }
  return data;
}

export async function linkWhatsAppNumber(
  token: string,
  payload: { phone_number: string; display_name?: string }
): Promise<WhatsAppAccount> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/accounts/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to initiate WhatsApp phone number linking');
  }
  return data;
}

export async function verifyWhatsAppNumber(
  token: string,
  payload: { phone_number: string; verification_token: string }
): Promise<WhatsAppAccount> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/accounts/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to verify WhatsApp phone number');
  }
  return data;
}

export async function listWhatsAppAccounts(token: string): Promise<WhatsAppAccount[]> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/accounts`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to list WhatsApp accounts');
  }
  return data;
}

export async function unlinkWhatsAppAccount(token: string, accountId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/accounts/${accountId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw parseApiError(data, response.status, 'Failed to unlink WhatsApp account');
  }
}

export async function sendWhatsAppMessage(
  token: string,
  payload: {
    recipient_number: string;
    content?: string;
    message_type?: string;
    template_name?: string;
    template_parameters?: any[];
    conversation_id?: string;
  }
): Promise<WhatsAppMessage> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to send WhatsApp message');
  }
  return data;
}

export async function listWhatsAppMessages(
  token: string,
  params?: { conversation_id?: string; direction?: string; delivery_status?: string }
): Promise<WhatsAppMessage[]> {
  const searchParams = new URLSearchParams();
  if (params?.conversation_id) searchParams.append('conversation_id', params.conversation_id);
  if (params?.direction) searchParams.append('direction', params.direction);
  if (params?.delivery_status) searchParams.append('delivery_status', params.delivery_status);

  const qs = searchParams.toString();
  const url = `${API_BASE_URL}/whatsapp/messages${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to list WhatsApp messages');
  }
  return data;
}

export async function simulateMockInboundWhatsApp(
  token: string,
  payload: {
    from_number: string;
    to_number?: string;
    content: string;
    trigger_analysis?: boolean;
  }
): Promise<WhatsAppMessage[]> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/mock/inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to simulate inbound WhatsApp message');
  }
  return data;
}

export async function simulateMockStatusUpdate(
  token: string,
  payload: {
    provider_message_id: string;
    status: string;
    error_code?: string;
    error_message?: string;
  }
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/mock/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw parseApiError(data, response.status, 'Failed to simulate WhatsApp status update');
  }
  return data;
}


