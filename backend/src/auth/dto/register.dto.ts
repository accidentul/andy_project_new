import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  companyName!: string

  @IsString()
  companySlug!: string

  @IsEmail()
  adminEmail!: string

  @IsString()
  adminName!: string

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: 'Password must include upper, lower case letters and a number' })
  adminPassword!: string

  @IsOptional()
  @IsString()
  plan?: string
}
