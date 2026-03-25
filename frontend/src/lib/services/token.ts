export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('healplace_token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('healplace_token');
    window.location.href = '/';
  }

  return response;
}
