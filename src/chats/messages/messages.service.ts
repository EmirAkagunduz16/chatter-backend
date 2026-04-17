import { Inject, Injectable } from '@nestjs/common';
import { ChatsRepository } from '../chats.repository';
import { CreateMessageInput } from './dto/create-message.input';
import { Types } from 'mongoose';
import { Message } from './entities/message.entity';
import { GetMessagesArgs } from './dto/get-messages.args';
import { PUB_SUB } from 'src/common/constants/injection-token';
import { PubSub } from 'graphql-subscriptions';
import { MESSAGE_CREATED } from './constants/pubSub-triggers';
import { MessageCreatedArgs } from './dto/message-created.args';
import { MessageDocument } from './entities/message.document';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
    private readonly userService: UsersService,
  ) {}

  async createMessage({ content, chatId }: CreateMessageInput, userId: string) {
    const messageDocument: MessageDocument = {
      content,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
      _id: new Types.ObjectId(),
    };
    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $push: {
          messages: messageDocument,
        },
      },
    );
    const message: Message = {
      ...messageDocument,
      chatId,
      user: await this.userService.findOne(userId),
    };
    await this.pubSub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });
    return message;
  }

  async getMessages({ chatId }: GetMessagesArgs) {
    const messages = await this.chatsRepository.model.aggregate([
      { $match: { _id: new Types.ObjectId(chatId) } },
      { $unwind: '$messages' },
      { $replaceRoot: { newRoot: '$messages' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $unset: 'userId' },
      { $set: { chatId } },
    ]);
    for (const message of messages) {
      message.user = this.userService.toEntity(message);
    }
    return messages;
  }

  async messageCreated({ chatId }: MessageCreatedArgs) {
    await this.chatsRepository.findOne({
      _id: chatId,
    });
    return this.pubSub.asyncIterableIterator(MESSAGE_CREATED);
  }
}
