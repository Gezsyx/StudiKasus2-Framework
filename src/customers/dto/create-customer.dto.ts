import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** DTO untuk POST /customers (mendaftarkan pelanggan baru). */
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail() // harus berformat email; keunikannya dicek di CustomersService.assertEmailFree()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
