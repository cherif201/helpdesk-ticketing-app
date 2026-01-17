import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Create new user account',
    description: 'Register a new user with email and password. Sends a welcome email upon successful registration.'
  })
  @ApiResponse({ status: 201, description: 'User successfully created. Returns user object and JWT token.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login to existing account',
    description: 'Authenticate with email and password. Returns JWT token valid for 7 days.'
  })
  @ApiResponse({ status: 200, description: 'Login successful. Returns user object and JWT token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email. Always returns success to prevent email enumeration. Token expires in 1 hour.'
  })
  @ApiResponse({ status: 200, description: 'If email exists, reset link has been sent.' })
  @ApiResponse({ status: 400, description: 'Invalid email format.' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset password using token from email. Token is single-use and expires in 1 hour.'
  })
  @ApiResponse({ status: 200, description: 'Password reset successful.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('change-password')
  @ApiOperation({
    summary: 'Change password (authenticated)',
    description: 'Change password for authenticated user. Requires current password verification.'
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid.' })
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
