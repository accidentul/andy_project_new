import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    })
  }

  async validate(payload: any) {
    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException()
    }
    
    // Fetch the full user object with relations
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['tenant', 'role', 'role.permissions'],
    })
    
    if (!user) {
      throw new UnauthorizedException()
    }
    
    return user
  }
}
