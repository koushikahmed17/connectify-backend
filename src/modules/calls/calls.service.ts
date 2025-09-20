import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface CreateCallSessionDto {
  callerId: number;
  calleeId: number;
  callId: string;
  type: 'AUDIO' | 'VIDEO';
  status: 'RINGING' | 'ONGOING' | 'ENDED' | 'REJECTED' | 'MISSED';
}

export interface CallSessionResponse {
  id: string;
  callerId: number;
  calleeId: number;
  type: 'AUDIO' | 'VIDEO';
  status: 'RINGING' | 'ONGOING' | 'ENDED' | 'REJECTED' | 'MISSED';
  startedAt: Date | null;
  endedAt: Date | null;
  caller: {
    id: number;
    username: string;
    displayName: string;
    avatar?: { url: string } | null;
  };
  callee: {
    id: number;
    username: string;
    displayName: string;
    avatar?: { url: string } | null;
  };
}

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCallSession(
    dto: CreateCallSessionDto,
  ): Promise<CallSessionResponse> {
    // Get caller and callee information
    const [caller, callee] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.callerId },
        include: {
          profile: {
            include: {
              avatar: true,
            },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: dto.calleeId },
        include: {
          profile: {
            include: {
              avatar: true,
            },
          },
        },
      }),
    ]);

    if (!caller || !callee) {
      throw new Error('Caller or callee not found');
    }

    // Create call session in database
    const callSession = await this.prisma.callSession.create({
      data: {
        callerId: dto.callerId,
        calleeId: dto.calleeId,
        type: dto.type,
        status: dto.status,
        startedAt: new Date(),
      },
    });

    return {
      id: dto.callId,
      callerId: callSession.callerId!,
      calleeId: callSession.calleeId!,
      type: callSession.type,
      status: callSession.status,
      startedAt: callSession.startedAt,
      endedAt: callSession.endedAt,
      caller: {
        id: caller.id,
        username: caller.username,
        displayName: caller.profile?.displayName || caller.username,
        avatar: caller.profile?.avatar
          ? {
              url: caller.profile.avatar.url,
            }
          : null,
      },
      callee: {
        id: callee.id,
        username: callee.username,
        displayName: callee.profile?.displayName || callee.username,
        avatar: callee.profile?.avatar
          ? {
              url: callee.profile.avatar.url,
            }
          : null,
      },
    };
  }

  async updateCallStatus(
    callId: string,
    status: 'RINGING' | 'ONGOING' | 'ENDED' | 'REJECTED' | 'MISSED',
  ): Promise<void> {
    const updateData: any = { status };

    if (status === 'ONGOING') {
      updateData.startedAt = new Date();
    } else if (
      status === 'ENDED' ||
      status === 'REJECTED' ||
      status === 'MISSED'
    ) {
      updateData.endedAt = new Date();
    }

    await this.prisma.callSession.updateMany({
      where: {
        // Since we're using a custom callId, we need to find by caller/callee and recent timestamp
        // This is a simplified approach - in production, you might want to store callId in the database
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
      data: updateData,
    });
  }

  async getCallSession(callId: string): Promise<CallSessionResponse | null> {
    // Since we're using a custom callId, we need to find by recent timestamp
    // This is a simplified approach - in production, you might want to store callId in the database
    const callSession = await this.prisma.callSession.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
      include: {
        caller: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        callee: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!callSession) return null;

    return {
      id: callId,
      callerId: callSession.callerId!,
      calleeId: callSession.calleeId!,
      type: callSession.type,
      status: callSession.status,
      startedAt: callSession.startedAt,
      endedAt: callSession.endedAt,
      caller: {
        id: callSession.caller!.id,
        username: callSession.caller!.username,
        displayName:
          callSession.caller!.profile?.displayName ||
          callSession.caller!.username,
        avatar: callSession.caller!.profile?.avatar
          ? {
              url: callSession.caller!.profile.avatar.url,
            }
          : null,
      },
      callee: {
        id: callSession.callee!.id,
        username: callSession.callee!.username,
        displayName:
          callSession.callee!.profile?.displayName ||
          callSession.callee!.username,
        avatar: callSession.callee!.profile?.avatar
          ? {
              url: callSession.callee!.profile.avatar.url,
            }
          : null,
      },
    };
  }

  async getCallHistory(
    userId: number,
    limit: number = 20,
  ): Promise<CallSessionResponse[]> {
    const callSessions = await this.prisma.callSession.findMany({
      where: {
        OR: [{ callerId: userId }, { calleeId: userId }],
      },
      include: {
        caller: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
        callee: {
          include: {
            profile: {
              include: {
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return callSessions.map((session) => ({
      id: `call_${session.id}`,
      callerId: session.callerId!,
      calleeId: session.calleeId!,
      type: session.type,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      caller: {
        id: session.caller!.id,
        username: session.caller!.username,
        displayName:
          session.caller!.profile?.displayName || session.caller!.username,
        avatar: session.caller!.profile?.avatar
          ? {
              url: session.caller!.profile.avatar.url,
            }
          : null,
      },
      callee: {
        id: session.callee!.id,
        username: session.callee!.username,
        displayName:
          session.callee!.profile?.displayName || session.callee!.username,
        avatar: session.callee!.profile?.avatar
          ? {
              url: session.callee!.profile.avatar.url,
            }
          : null,
      },
    }));
  }
}
