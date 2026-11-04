import type { INestApplicationContext } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import type { Server, ServerOptions } from "socket.io";

/**
 * Socket.IO partagé entre instances de l'API via Redis : un événement émis par une instance
 * (ou par un job) atteint les clients connectés à toutes les autres.
 */
export class RedisIoAdapter extends IoAdapter {
  private clients: Redis[] = [];
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplicationContext,
    private readonly corsOrigin: string,
  ) {
    super(app);
  }

  async connectToRedis(url: string): Promise<void> {
    const pub = new Redis(url, { lazyConnect: true });
    const sub = pub.duplicate();
    this.clients = [pub, sub];
    await Promise.all(this.clients.map((client) => client.connect()));
    this.adapterConstructor = createAdapter(pub, sub);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigin, credentials: true },
    });
    if (this.adapterConstructor) server.adapter(this.adapterConstructor);
    return server;
  }

  override async dispose(): Promise<void> {
    await super.dispose();
    await Promise.all(this.clients.map((client) => client.quit()));
  }
}
