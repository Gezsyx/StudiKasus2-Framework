import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { OrderItemsModule } from './order-items/order-items.module.js';

/**
 * MODULE UTAMA: menggabungkan konfigurasi, koneksi database, dan semua modul fitur.
 * Peta aplikasi:  request -> Controller -> Service -> Repository/TypeORM -> PostgreSQL
 */
@Module({
  imports: [
    // Membaca file .env (lihat .env.example). Nilai dari environment OS tetap diutamakan.
    ConfigModule.forRoot({ isGlobal: true }),
    // KONEKSI DATABASE. forRootAsync dipakai karena nilainya baru bisa dibaca setelah ConfigModule siap.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        // SQLite in-memory hanya dipakai oleh test otomatis (DB_TYPE=better-sqlite3) agar tidak menyentuh database asli.
        if (config.get<string>('DB_TYPE') === 'better-sqlite3') {
          return {
            type: 'better-sqlite3',
            database: config.get<string>('DB_FILE', ':memory:'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        // Konfigurasi utama: PostgreSQL. Semua nilai berasal dari .env (tidak ada password di kode).
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_DATABASE'),
          // autoLoadEntities: entity yang didaftarkan lewat forFeature() di tiap modul otomatis dikenali.
          autoLoadEntities: true,
          // synchronize: tabel dibuat/disesuaikan otomatis dari entity (inilah "migrasi" untuk development).
          // Default: aktif kecuali production. Bisa dipaksa lewat DB_SYNCHRONIZE.
          synchronize: config.get<string>('DB_SYNCHRONIZE', String(!isProduction)) === 'true',
        };
      },
    }),
    // Modul fitur (masing-masing: controller + service + entity).
    ProductsModule,
    CategoriesModule,
    CustomersModule,
    OrdersModule,
    OrderItemsModule,
  ],
  controllers: [AppController], // GET / (pesan "API berjalan")
  providers: [AppService],
})
export class AppModule {}
