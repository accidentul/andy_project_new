import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator'

export class CreateConnectorDto {
  @IsIn(['salesforce', 'hubspot'])
  provider!: 'salesforce' | 'hubspot'

  @IsObject()
  credentials!: Record<string, any>

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
