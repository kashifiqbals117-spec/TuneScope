/**
 * Error translation utility for TuneScope.
 * Translates raw technical codes, network faults, and database errors into clean,
 * actionable, user-friendly messages.
 * Never exposes stack traces, SQL errors, credentials, or internal server paths.
 */

export interface FriendlyError {
  title: string;
  message: string;
  status?: number;
  canRetry: boolean;
}

export function getUserFriendlyError(error: any): FriendlyError {
  if (!error) {
    return {
      title: 'Unexpected Error',
      message: 'An unexpected issue occurred. Please try again.',
      canRetry: true,
    };
  }

  const rawMessage = (error.message || String(error)).toLowerCase();
  const status = error.status || error.statusCode || (error.response && error.response.status);

  // Network and Connectivity Errors
  if (
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('network error') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('err_connection_refused') ||
    rawMessage.includes('connection refused') ||
    rawMessage.includes('etimedout') ||
    rawMessage.includes('networkerror')
  ) {
    return {
      title: 'Connection Issue',
      message: "We're having trouble connecting to the server. Please check your connection and try again shortly.",
      status: 0,
      canRetry: true,
    };
  }

  // Authentication & Session Errors
  if (status === 401 || rawMessage.includes('jwt expired') || rawMessage.includes('token expired') || rawMessage.includes('unauthorized')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again to continue.',
      status: 401,
      canRetry: false,
    };
  }

  // Spotify Developer Restriction (403)
  if (
    status === 403 ||
    rawMessage.includes('premium subscription required') ||
    rawMessage.includes('active premium subscription') ||
    rawMessage.includes('developer restriction')
  ) {
    return {
      title: 'Spotify Access Restricted',
      message: "We couldn't access Spotify right now. Under Spotify's developer policy, the app owner account requires an active Spotify Premium subscription.",
      status: 403,
      canRetry: true,
    };
  }

  // Permission / Forbidden Errors
  if (status === 403) {
    return {
      title: 'Access Restricted',
      message: 'You do not have permission to view or modify this resource.',
      status: 403,
      canRetry: false,
    };
  }

  // Not Found Errors
  if (status === 404 || rawMessage.includes('not found')) {
    return {
      title: 'Resource Not Found',
      message: 'The requested music record, recap, or profile could not be located.',
      status: 404,
      canRetry: false,
    };
  }

  // Rate Limiting
  if (status === 429 || rawMessage.includes('too many requests')) {
    return {
      title: 'Too Many Requests',
      message: 'You are doing that a bit too fast. Please pause for a moment and try again shortly.',
      status: 429,
      canRetry: true,
    };
  }

  // Database / Internal Server Errors
  if (
    status >= 500 ||
    rawMessage.includes('database') ||
    rawMessage.includes('prisma') ||
    rawMessage.includes('postgres') ||
    rawMessage.includes('internal server error') ||
    rawMessage.includes('sql')
  ) {
    return {
      title: 'Service Temporarily Unavailable',
      message: 'Some services are temporarily unavailable. Our team has been notified. Please try again later.',
      status: status || 500,
      canRetry: true,
    };
  }

  // Validation Errors
  if (status === 400 || rawMessage.includes('validation')) {
    const cleanMsg = typeof error.message === 'string' && !error.message.includes('{')
      ? error.message
      : 'Please check your inputs and try again.';
    return {
      title: 'Invalid Request',
      message: cleanMsg,
      status: 400,
      canRetry: true,
    };
  }

  // Fallback for general errors
  return {
    title: 'Action Failed',
    message: typeof error.message === 'string' && error.message.length < 120 && !error.message.includes('Error:')
      ? error.message
      : 'Something went wrong while processing your request. Please try again.',
    status,
    canRetry: true,
  };
}
