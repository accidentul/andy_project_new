import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from './permissions.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true
    const req = context.switchToHttp().getRequest()
    const user = req.user
    if (!user) return false
    
    // Get permissions from user.role.permissions array or user.permissions
    let userPerms: string[] = []
    if (user.role?.permissions) {
      userPerms = user.role.permissions.map((p: any) => p.key || p)
    } else if (user.permissions) {
      userPerms = user.permissions
    }
    
    return required.every((p) => userPerms.includes(p))
  }
}
