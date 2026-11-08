import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

/** Controller untuk pelanggan. Semua route diawali "/customers". Logika ada di customers.service.ts. */
@ApiTags('Customers')
@ApiBadRequestResponse({ description: 'Input tidak valid' })
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ===== CREATE ===== POST /customers -> 201 Created, atau 409 jika email sudah terdaftar
  @ApiConflictResponse({ description: 'Email sudah terdaftar' })
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  // ===== READ (daftar) ===== GET /customers -> 200 OK
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  // ===== READ (detail) ===== GET /customers/:id -> 200 OK (beserta daftar pesanannya), atau 404
  @ApiNotFoundResponse({ description: 'Pelanggan tidak ditemukan' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  // ===== UPDATE (sebagian) ===== PATCH /customers/:id -> 200 OK
  @ApiNotFoundResponse({ description: 'Pelanggan tidak ditemukan' })
  @ApiConflictResponse({ description: 'Email sudah dipakai pelanggan lain' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  // ===== DELETE ===== DELETE /customers/:id -> 200 OK, 404, atau 409 jika masih punya pesanan
  @ApiNotFoundResponse({ description: 'Pelanggan tidak ditemukan' })
  @ApiConflictResponse({ description: 'Pelanggan masih memiliki pesanan' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
