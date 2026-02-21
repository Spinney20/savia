import { Body, Controller, Get, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import {
  LoginSchema,
  RefreshTokenSchema,
  ActivateAccountSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@ssm/shared';
import type {
  LoginInput,
  RefreshTokenInput,
  ActivateAccountInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthUser,
} from '@ssm/shared';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: LoginInput) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(RefreshTokenSchema))
  refresh(@Body() body: RefreshTokenInput) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.userId);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user);
  }

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ActivateAccountSchema))
  activate(@Body() body: ActivateAccountInput) {
    return this.authService.activate(body.token, body.password);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  async forgotPassword(@Body() body: ForgotPasswordInput) {
    await this.authService.forgotPassword(body.email);
    return { message: 'Dacă adresa de email există, veți primi un link de resetare.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() body: ResetPasswordInput) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Parola a fost resetată cu succes. Vă rugăm să vă autentificați din nou.' };
  }
}
