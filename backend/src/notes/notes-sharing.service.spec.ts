import { ForbiddenException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { AccessLevel } from 'src/enums/access-level.enum';
import { UserRole } from 'src/enums/user-role.enum';
import {
  NOTE_ACCESS_REVOKED_EVENT,
  NOTE_INVITE_EVENT,
  NOTE_SHARED_EVENT,
  SHARE_LINK_CLAIMED_EVENT,
} from 'src/notifications/notifications.events';

const DAY = 24 * 60 * 60 * 1000;

describe('NotesService sharing', () => {
  let noteRepo: { findOneBy: jest.Mock; save: jest.Mock };
  let memberRepo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let shareLinkRepo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let projectsService: { findOneRaw: jest.Mock };
  let mailService: { sendNoteShareEmail: jest.Mock };
  let usersService: { find: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let service: NotesService;

  beforeEach(() => {
    noteRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 5,
        ownerId: 10,
        projectId: null,
        title: 'Budget',
      }),
      save: jest.fn((note) => Promise.resolve(note)),
    };
    memberRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 1, ...data })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    shareLinkRepo = {
      findOneBy: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 77, ...data })),
    };
    projectsService = { findOneRaw: jest.fn() };
    mailService = { sendNoteShareEmail: jest.fn() };
    usersService = { find: jest.fn().mockResolvedValue([]) };
    eventEmitter = { emit: jest.fn() };
    service = new NotesService(
      noteRepo as any,
      memberRepo as any,
      shareLinkRepo as any,
      projectsService as any,
      {} as any,
      {} as any,
      {} as any,
      mailService as any,
      { get: () => 'http://localhost:3000' } as any,
      eventEmitter as any,
      usersService as any,
    );
  });

  describe('who can manage access', () => {
    it('lets the owner of a private note share it', async () => {
      await service.grantAccess(5, null, 10, UserRole.USER, { userId: 20 });

      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('blocks anyone else on a private note', async () => {
      await expect(
        service.grantAccess(5, null, 20, UserRole.USER, { userId: 30 }),
      ).rejects.toThrow(ForbiddenException);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

    it('requires the project owner for a note inside a project', async () => {
      noteRepo.findOneBy.mockResolvedValue({ id: 5, ownerId: 20, projectId: 3 });
      projectsService.findOneRaw.mockResolvedValue({ id: 3, ownerId: 10 });

      await expect(
        service.grantAccess(5, null, 20, UserRole.USER, { userId: 30 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets the project owner manage a note in their project', async () => {
      noteRepo.findOneBy.mockResolvedValue({ id: 5, ownerId: 20, projectId: 3 });
      projectsService.findOneRaw.mockResolvedValue({ id: 3, ownerId: 10 });

      await service.grantAccess(5, null, 10, UserRole.USER, { userId: 30 });

      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('lets an admin skip the ownership check', async () => {
      await service.grantAccess(5, null, 99, UserRole.ADMIN, { userId: 30 });

      expect(noteRepo.findOneBy).not.toHaveBeenCalled();
      expect(memberRepo.save).toHaveBeenCalled();
    });
  });

  describe('grantAccess', () => {
    it('gives VIEW by default and notifies the user', async () => {
      const member = await service.grantAccess(5, null, 10, UserRole.USER, {
        userId: 20,
      });

      expect(member.accessLevel).toBe(AccessLevel.VIEW);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NOTE_SHARED_EVENT,
        expect.objectContaining({
          noteId: 5,
          recipientUserId: 20,
          actorId: 10,
          accessLevel: AccessLevel.VIEW,
        }),
      );
    });

    it('updates an existing membership instead of creating a duplicate', async () => {
      memberRepo.findOneBy.mockResolvedValue({
        id: 3,
        noteId: 5,
        userId: 20,
        accessLevel: AccessLevel.VIEW,
      });

      const member = await service.grantAccess(5, null, 10, UserRole.USER, {
        userId: 20,
        accessLevel: AccessLevel.EDIT,
      });

      expect(memberRepo.create).not.toHaveBeenCalled();
      expect(member.accessLevel).toBe(AccessLevel.EDIT);
    });
  });

  it('revokeAccess removes the membership and notifies the user', async () => {
    await service.revokeAccess(5, null, 20, 10, UserRole.USER);

    expect(memberRepo.delete).toHaveBeenCalledWith({ noteId: 5, userId: 20 });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      NOTE_ACCESS_REVOKED_EVENT,
      expect.objectContaining({ noteId: 5, recipientUserId: 20 }),
    );
  });

  describe('leaveNote', () => {
    it('does not let the owner leave their own note', async () => {
      await expect(service.leaveNote(5, null, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('fails when the user has no direct membership', async () => {
      memberRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.leaveNote(5, null, 20)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('removes the membership of a member', async () => {
      await service.leaveNote(5, null, 20);

      expect(memberRepo.delete).toHaveBeenCalledWith({ noteId: 5, userId: 20 });
    });
  });

  describe('createShareLink', () => {
    it('creates a random 64-character token with VIEW access and no expiry by default', async () => {
      const link = await service.createShareLink(5, null, 10, UserRole.USER, {});

      expect(link.token).toMatch(/^[0-9a-f]{64}$/);
      expect(link.accessLevel).toBe(AccessLevel.VIEW);
      expect(link.expiresAt).toBeNull();
      expect(link.email).toBeNull();
    });

    it('gives every link a different token', async () => {
      const first = await service.createShareLink(5, null, 10, UserRole.USER, {});
      const second = await service.createShareLink(5, null, 10, UserRole.USER, {});

      expect(first.token).not.toBe(second.token);
    });

    it('sets the expiry date from expiresInDays', async () => {
      const before = Date.now();

      const link = await service.createShareLink(5, null, 10, UserRole.USER, {
        expiresInDays: 7,
      });

      const expiresIn = link.expiresAt!.getTime() - before;
      expect(expiresIn).toBeGreaterThanOrEqual(7 * DAY);
      expect(expiresIn).toBeLessThan(7 * DAY + 5000);
    });

    it('emails the link and sends an in-app invite when the email has an account', async () => {
      usersService.find.mockResolvedValue([{ id: 30 }]);

      const link = await service.createShareLink(5, null, 10, UserRole.USER, {
        email: 'ola@example.com',
        accessLevel: AccessLevel.EDIT,
      });

      expect(mailService.sendNoteShareEmail).toHaveBeenCalledWith(
        'ola@example.com',
        'Budget',
        `http://localhost:3000/shared/${link.token}`,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NOTE_INVITE_EVENT,
        expect.objectContaining({
          noteId: 5,
          shareLinkId: 77,
          recipientUserId: 30,
          accessLevel: AccessLevel.EDIT,
        }),
      );
    });

    it('only emails the link when the email has no account yet', async () => {
      await service.createShareLink(5, null, 10, UserRole.USER, {
        email: 'new@example.com',
      });

      expect(mailService.sendNoteShareEmail).toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('is only available to the owner', async () => {
      await expect(
        service.createShareLink(5, null, 20, UserRole.USER, {}),
      ).rejects.toThrow(ForbiddenException);
      expect(shareLinkRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('opening a share link', () => {
    it('rejects an unknown token', async () => {
      shareLinkRepo.findOneBy.mockResolvedValue(null);

      await expect(service.claimShareLink('nope', 20)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects a revoked link', async () => {
      shareLinkRepo.findOneBy.mockResolvedValue({
        id: 77,
        noteId: 5,
        revoked: true,
        expiresAt: null,
        accessLevel: AccessLevel.VIEW,
      });

      await expect(service.claimShareLink('abc', 20)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects an expired link', async () => {
      shareLinkRepo.findOneBy.mockResolvedValue({
        id: 77,
        noteId: 5,
        revoked: false,
        expiresAt: new Date(Date.now() - 1000),
        accessLevel: AccessLevel.VIEW,
      });

      await expect(service.claimShareLink('abc', 20)).rejects.toThrow(
        ForbiddenException,
      );
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

    it('does not let a VIEW link edit the note', async () => {
      shareLinkRepo.findOneBy.mockResolvedValue({
        id: 77,
        noteId: 5,
        revoked: false,
        expiresAt: null,
        accessLevel: AccessLevel.VIEW,
      });

      await expect(
        service.updateSharedNote('abc', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
      expect(noteRepo.save).not.toHaveBeenCalled();
    });

    it('lets an EDIT link edit the note', async () => {
      shareLinkRepo.findOneBy.mockResolvedValue({
        id: 77,
        noteId: 5,
        revoked: false,
        expiresAt: new Date(Date.now() + DAY),
        accessLevel: AccessLevel.EDIT,
      });

      const note = await service.updateSharedNote('abc', {
        title: 'Updated',
        keywords: ['budget'],
      });

      expect(note.title).toBe('Updated');
      expect(note.keywords).toEqual(['BUDGET']);
    });
  });

  describe('claimShareLink', () => {
    beforeEach(() => {
      shareLinkRepo.findOneBy.mockResolvedValue({
        id: 77,
        noteId: 5,
        revoked: false,
        expiresAt: null,
        accessLevel: AccessLevel.EDIT,
      });
    });

    it('turns the link into a membership and notifies the owner', async () => {
      const member = await service.claimShareLink('abc', 20);

      expect(member).toMatchObject({
        noteId: 5,
        userId: 20,
        accessLevel: AccessLevel.EDIT,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SHARE_LINK_CLAIMED_EVENT,
        expect.objectContaining({
          noteId: 5,
          ownerId: 10,
          claimerId: 20,
          shareLinkId: 77,
        }),
      );
    });

    it('updates an existing membership to the level of the link', async () => {
      memberRepo.findOneBy.mockResolvedValue({
        id: 3,
        noteId: 5,
        userId: 20,
        accessLevel: AccessLevel.VIEW,
      });

      const member = await service.claimShareLink('abc', 20);

      expect(memberRepo.create).not.toHaveBeenCalled();
      expect(member.accessLevel).toBe(AccessLevel.EDIT);
    });
  });
});
