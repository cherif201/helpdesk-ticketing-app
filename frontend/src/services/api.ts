const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  token: string;
}

interface MessageResponse {
  message: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'AGENT' | 'ADMIN';
}

export interface Ticket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  assignedToUserId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  assignedTo?: User;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: User;
}

export interface AuditEvent {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  actor?: User;
}

class ApiService {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async signup(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = 'Signup failed';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        // Response is not JSON
        errorMessage = `Signup failed: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }

    return response.json();
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password change failed');
    }

    return response.json();
  }

  async getTickets(showAll?: boolean): Promise<Ticket[]> {
    const url = showAll
      ? `${API_BASE_URL}/tickets?showAll=true`
      : `${API_BASE_URL}/tickets`;

    const response = await fetch(url, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch tickets');
    }

    return response.json();
  }

  async createTicket(data: { title: string; description: string }): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create ticket');
    }

    return response.json();
  }

  async updateTicket(id: string, data: { status?: 'OPEN' | 'IN_PROGRESS' | 'DONE' }): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update ticket');
    }

    return response.json();
  }

  // Admin endpoints
  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user role');
    }

    return response.json();
  }

  async getAgents(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/agents`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch agents');
    }

    return response.json();
  }

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch users');
    }

    return response.json();
  }

  // Ticket assignment
  async assignTicket(ticketId: string, assignedToUserId: string | null): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ assignedToUserId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to assign ticket');
    }

    return response.json();
  }

  async getInbox(): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/inbox`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch inbox');
    }

    return response.json();
  }

  // Comments
  async addComment(ticketId: string, body: string, isInternal: boolean = false): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ body, isInternal }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add comment');
    }

    return response.json();
  }

  async getComments(ticketId: string): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch comments');
    }

    return response.json();
  }

  async deleteTicket(ticketId: string): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete ticket');
    }

    return response.json();
  }

  // Audit
  async getTicketAudit(ticketId: string): Promise<AuditEvent[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/audit`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch audit trail');
    }

    return response.json();
  }
}

export const api = new ApiService();
