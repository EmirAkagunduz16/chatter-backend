import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import { Types } from 'mongoose';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  @UseGuards(GqlAuthGuard)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  @UseGuards(GqlAuthGuard)
  async findOne(@Args('_id') _id: string): Promise<User> {
    return this.usersService.findOne(_id);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.usersService.update(user._id.toString(), updateUserInput);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async removeUser(@CurrentUser() user: User): Promise<User> {
    return this.usersService.remove(user._id.toString());
  }

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async getMe(@CurrentUser() user: TokenPayload): Promise<User> {
    return { ...user, _id: new Types.ObjectId(user._id) };
  }
}
