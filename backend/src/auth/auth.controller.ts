import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { LocalAuthGuard } from './local.guard'
import { AuthGuard } from '@nestjs/passport'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-admin')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerAdmin(dto)
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() req: any) {
    return this.authService.login(req.user)
  }

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any) {
    // In a production app, you might want to:
    // - Invalidate the token in a blacklist
    // - Clear server-side session
    // - Log the logout event
    return { 
      success: true, 
      message: 'Logged out successfully',
      userId: req.user.id || req.user.sub 
    }
  }
}