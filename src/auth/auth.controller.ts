import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { AuthService, TokenPair } from './auth.service.js'
import { Public } from './decorators/public.decorator.js'
import { AppleLoginDto } from './dto/apple-login.dto.js'
import { GoogleMobileLoginDto } from './dto/google-mobile-login.dto.js'
import { RefreshDto } from './dto/refresh.dto.js'
import { SendOtpDto } from './dto/send-otp.dto.js'
import { VerifyOtpDto } from './dto/verify-otp.dto.js'
import { AppleAuthGuard } from './guards/apple-auth.guard.js'
import { GoogleAuthGuard } from './guards/google-auth.guard.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  // ─── Google Web ──────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.googleLogin(
      req.user as Parameters<AuthService['googleLogin']>[0],
      req.headers['user-agent'],
    )
    this.setRefreshCookie(res, tokens.refreshToken)
    const webAppUrl = this.config.get<string>('WEB_APP_URL', 'http://localhost:3001')
    return res.redirect(`${webAppUrl}/auth/callback?access=${tokens.accessToken}`)
  }

  // ─── Google Mobile ───────────────────────────────────────────────────────────

  @Public()
  @Post('google/mobile')
  googleMobile(@Body() dto: GoogleMobileLoginDto, @Req() req: Request): Promise<TokenPair> {
    return this.authService.googleMobileLogin(dto.idToken, req.headers['user-agent'])
  }

  // ─── Apple Mobile ─────────────────────────────────────────────────────────────

  @Public()
  @Post('apple')
  apple(@Body() dto: AppleLoginDto, @Req() req: Request): Promise<TokenPair> {
    return this.authService.appleLogin(dto.identityToken, req.headers['user-agent'])
  }

  // ─── Apple Web ───────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(AppleAuthGuard)
  @Get('apple/web')
  async appleAuth() {
  }

  @Public()
  @UseGuards(AppleAuthGuard)
  @Get('apple/callback')
  async appleCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.appleWebLogin(
      req.user as Parameters<AuthService['appleWebLogin']>[0],
      req.headers['user-agent'],
    )
    this.setRefreshCookie(res, tokens.refreshToken)
    const webAppUrl = this.config.get<string>('WEB_APP_URL', 'http://localhost:3001')
    return res.redirect(`${webAppUrl}/auth/callback?access=${tokens.accessToken}`)
  }

  // ─── Email OTP ────────────────────────────────────────────────────────────────

  @Public()
  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email)
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenPair> {
    const result = await this.authService.verifyOtp(
      dto.email,
      dto.otp,
      req.headers['user-agent'],
    )
    this.setRefreshCookie(res, result.refreshToken)
    return result
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = (req.cookies as Record<string, string>)?.['refresh_token'] ?? dto.refreshToken
    if (!rawToken) throw new UnauthorizedException('No refresh token provided')

    const result = await this.authService.rotateRefreshToken(rawToken, req.headers['user-agent'])
    this.setRefreshCookie(res, result.refreshToken)
    return { accessToken: result.accessToken, refreshToken: result.refreshToken }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Body() dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = (req.cookies as Record<string, string>)?.['refresh_token'] ?? dto.refreshToken
    if (rawToken) await this.authService.revokeRefreshToken(rawToken)
    res.clearCookie('refresh_token')
    return { message: 'Logged out successfully' }
  }

  // ─── Me (protected) ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    return req.user
  }

  // ─── Cookie Helper ────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string) {
    const sameSite = this.config.get<'lax' | 'strict' | 'none'>(
      'COOKIE_SAME_SITE',
      'lax',
    )
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
  }
}
