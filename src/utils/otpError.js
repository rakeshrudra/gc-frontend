function getStringField(error, field) {
  if (!error || typeof error !== 'object' || !(field in error)) return null;
  const value = error[field];
  return typeof value === 'string' ? value : null;
}

function getNestedStringField(error, path) {
  let current = error;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }
    current = current[key];
  }
  return typeof current === 'string' ? current : null;
}

function isSafeHumanMessage(message) {
  const normalized = message.trim();
  const technicalFragments = [
    '[object Object]',
    'AxiosError',
    'Firebase:',
    'auth/',
    'stack',
    ' at ',
    '{',
    '}',
  ];

  return (
    normalized.length > 0 &&
    normalized.length <= 180 &&
    !technicalFragments.some((fragment) => normalized.includes(fragment))
  );
}

export function getReadableOtpError(error) {
  const code = getStringField(error, 'code');
  const rawMessage =
    getNestedStringField(error, ['response', 'data', 'message']) ||
    getNestedStringField(error, ['data', 'message']) ||
    getStringField(error, 'message');
  const lowerMessage = rawMessage?.toLowerCase();

  if (code?.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (
    code?.includes('invalid-phone-number') ||
    code?.includes('missing-phone-number')
  ) {
    return 'This phone number could not be verified. Please check it and try again.';
  }

  if (code?.includes('invalid-verification-code')) {
    return 'The OTP you entered is incorrect. Please try again.';
  }

  if (code?.includes('code-expired')) {
    return 'This OTP has expired. Please request a new one.';
  }

  if (
    code?.includes('network') ||
    lowerMessage?.includes('network request failed') ||
    lowerMessage?.includes('network error')
  ) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  if (rawMessage && isSafeHumanMessage(rawMessage)) {
    return rawMessage.trim();
  }

  return 'Something went wrong while sending the OTP. Please try again.';
}
