import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UsersRepository } from './users.repository';
import { S3Service } from 'src/common/s3/s3.service';
import { USERS_BUCKET, USERS_IMAGE_FILE_EXTENSION } from './users.constants';
import { UserDocument } from './entities/user.document';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(createUserInput: CreateUserInput) {
    try {
      return this.toEntity(
        await this.usersRepository.create({
          ...createUserInput,
          password: await this.hashPassword(createUserInput.password),
        }),
      );
    } catch (error) {
      if ((error as { code: number }).code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async findAll() {
    return (await this.usersRepository.find({})).map((userDocument) =>
      this.toEntity(userDocument),
    );
  }

  async findOne(_id: string) {
    return this.toEntity(await this.usersRepository.findOne({ _id }));
  }

  async update(_id: string, updateUserInput: UpdateUserInput) {
    return this.toEntity(
      await this.usersRepository.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...updateUserInput,
            password: await this.hashPassword(updateUserInput.password!),
          },
        },
      ),
    );
  }

  async remove(_id: string) {
    return this.toEntity(await this.usersRepository.findOneAndDelete({ _id }));
  }

  async verifyUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Credentials are not valid');
    }
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid');
    }
    return this.toEntity(user);
  }

  async uploadImage(file: Buffer, userId: string) {
    await this.s3Service.upload({
      bucket: USERS_BUCKET,
      key: this.getUserImage(userId),
      file,
    });
  }

  toEntity(userDocument: UserDocument): User {
    const { password, ...rest } = userDocument;
    const user = {
      ...rest,
      imageUrl: this.s3Service.getObjectUrl(
        USERS_BUCKET,
        this.getUserImage(userDocument._id.toString()),
      ),
    };
    return user;
  }

  private getUserImage(userId: string) {
    return `${userId}.${USERS_IMAGE_FILE_EXTENSION}`;
  }
}
