import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    })
  }

  async validate(payload: any) {
    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException('Invalid token payload')
    }
    
    try {
      // Fetch the full user object with relations using the service
      const user = await this.usersService.findById(payload.sub)
      
      if (!user) {
        throw new UnauthorizedException('User not found')
      }
      
      // Ensure user has proper tenant association
      if (user.tenant?.id !== payload.tenantId) {
        throw new UnauthorizedException('Tenant mismatch')
      }
      
      return user
    } catch (error) {
      console.error('JWT validation error:', error)
      throw new UnauthorizedException('Token validation failed')
    }
  }
}
