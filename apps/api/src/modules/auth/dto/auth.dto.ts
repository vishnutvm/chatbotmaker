import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OnboardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  organizationName?: string;
}
