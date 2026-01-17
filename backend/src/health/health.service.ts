import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as promClient from 'prom-client';

@Injectable()
export class HealthService {
  private register: promClient.Registry;
  private httpRequestDuration: promClient.Histogram;
  private httpRequestTotal: promClient.Counter;

  constructor(private prisma: PrismaService) {
    this.register = new promClient.Registry();
    
    // Default metrics
    promClient.collectDefaultMetrics({ register: this.register });

    // Custom metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });
  }

  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async ready() {
    try {
      // Check DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getMetrics() {
    return this.register.metrics();
  }

  recordRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }
}
