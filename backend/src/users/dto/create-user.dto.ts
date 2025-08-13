import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  name!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsString()
  roleId!: string

  @IsOptional()
  @IsString()
  roleTitle?: string

  @IsOptional()
  @IsString()
  department?: string
}
