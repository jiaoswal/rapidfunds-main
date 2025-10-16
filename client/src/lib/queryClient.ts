import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { browserApi } from "./browserApi";

// Browser-based API request function
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Parse the URL to determine which API method to call
  const urlParts = url.split('/').filter(part => part);
  
  try {
    let result: any;
    
    // Route API calls to browser API methods
    if (url === '/api/user') {
      result = await browserApi.getCurrentUser();
    } else if (url === '/api/organization') {
      result = await browserApi.getOrganization();
    } else if (url === '/api/users') {
      result = await browserApi.getUsers();
    } else if (url === '/api/approvers') {
      result = await browserApi.getApprovers();
    } else if (url === '/api/requests') {
      if (method === 'GET') {
        result = await browserApi.getRequests();
      } else if (method === 'POST') {
        result = await browserApi.createRequest(data);
      }
    } else if (url.startsWith('/api/requests/') && url.endsWith('/status')) {
      const requestId = urlParts[2];
      result = await browserApi.updateRequestStatus(requestId, (data as any).status, (data as any).comments, (data as any).isFastTrack);
    } else if (url.startsWith('/api/requests/') && url.endsWith('/messages')) {
      const requestId = urlParts[2];
      if (method === 'GET') {
        result = await browserApi.getRequestMessages(requestId);
      } else if (method === 'POST') {
        result = await browserApi.createRequestMessage(requestId, data);
      }
    } else if (url.startsWith('/api/requests/') && url.endsWith('/approval-history')) {
      const requestId = urlParts[2];
      result = await browserApi.getApprovalHistory(requestId);
    } else if (url === '/api/invite-tokens') {
      if (method === 'GET') {
        result = await browserApi.getInviteTokens();
      } else if (method === 'POST') {
        result = await browserApi.createInviteToken((data as any).role, (data as any).expiresInDays);
      }
    } else if (url.startsWith('/api/invite-tokens/') && url.endsWith('/validate')) {
      const token = urlParts[2];
      result = await browserApi.validateInviteToken(token);
    } else if (url.startsWith('/api/invite-tokens/') && method === 'DELETE') {
      const tokenId = urlParts[2];
      await browserApi.deleteInviteToken(tokenId);
      result = { success: true };
    } else if (url === '/api/org-chart') {
      if (method === 'GET') {
        result = await browserApi.getOrgChart();
      } else if (method === 'POST') {
        result = await browserApi.createOrgChartNode(data);
      }
    } else if (url.startsWith('/api/org-chart/')) {
      const nodeId = urlParts[2];
      if (method === 'DELETE') {
        await browserApi.deleteOrgChartNode(nodeId);
        result = null;
      } else if (url.endsWith('/move') && method === 'PUT') {
        result = await browserApi.moveOrgChartNode(nodeId, (data as any).newParentId, (data as any).newLevel);
      }
    } else if (url === '/api/approval-chains') {
      if (method === 'GET') {
        result = await browserApi.getApprovalChains();
      } else if (method === 'POST') {
        result = await browserApi.createApprovalChain(data);
      }
    } else if (url === '/api/approval-chains/default') {
      result = await browserApi.getDefaultApprovalChain();
    } else if (url.startsWith('/api/approval-chains/')) {
      const chainId = urlParts[2];
      if (method === 'PATCH') {
        result = await browserApi.updateApprovalChain(chainId, data);
      } else if (method === 'DELETE') {
        await browserApi.deleteApprovalChain(chainId);
        result = null;
      }
    } else if (url === '/api/upload') {
      result = await browserApi.uploadFile(data as File);
    } else if (url === '/api/upload/logo') {
      result = await browserApi.uploadLogo(data as File);
    } else if (url === '/api/login') {
      result = await browserApi.login((data as any).email, (data as any).password);
          } else if (url === '/api/register') {
            if ((data as any).inviteCode) {
              // This is a join organization request (has inviteCode)
              result = await browserApi.joinOrganization((data as any).inviteCode, (data as any).email, (data as any).password, (data as any).fullName, (data as any).phoneNumber);
            } else {
              // This is a create organization request (has name, adminEmail, adminFullName)
              result = await browserApi.register((data as any).orgCode, (data as any).name, (data as any).adminEmail, (data as any).adminPassword, (data as any).adminFullName);
            }
          } else if (url === '/api/logout') {
      await browserApi.logout();
      result = null;
    } else {
      throw new Error(`Unknown API endpoint: ${url}`);
    }
    
    // Create a mock Response object
    return {
      ok: true,
      status: 200,
      json: async () => result,
      text: async () => JSON.stringify(result)
    } as Response;
    
  } catch (error) {
    // Create a mock error Response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ok: false,
      status: 400,
      statusText: errorMessage,
      json: async () => ({ error: errorMessage }),
      text: async () => errorMessage
    } as Response;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const res = await apiRequest('GET', url);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
