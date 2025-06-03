import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // We don't want to return the password hash to the client
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Create new user
    const newUser = await this.usersService.create(userData);
    
    // Remove password hash before returning
    const { passwordHash, ...result } = newUser;
    
    // Generate JWT token
    const payload = { email: result.email, sub: result.id, role: result.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }
}
