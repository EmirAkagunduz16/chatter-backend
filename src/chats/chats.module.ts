import { forwardRef, Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsResolver } from './chats.resolver';
import { ChatsRepository } from './chats.repository';
import { Chat } from './entities/chat.entity';
import { DatabaseModule } from 'src/common/database/database.module';
import { MessagesModule } from './messages/messages.module';
import { ChatSchema } from './entities/chat.document';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    DatabaseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    forwardRef(() => MessagesModule),
    UsersModule,
  ],
  providers: [ChatsResolver, ChatsService, ChatsRepository],
  exports: [ChatsRepository],
})
export class ChatsModule {}
