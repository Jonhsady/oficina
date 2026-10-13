import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config.module';
import { CustomersModule } from './customers/customers.module';
import { EquipmentModule } from './equipment/equipment.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    StorageModule,
    AuthModule,
    HealthModule,
    CustomersModule,
    EquipmentModule,
    OrdersModule,
  ],
})
export class AppModule {}
