import { Module } from '@nestjs/common';
import { AppService } from './app.service';
// Видаляємо AppController з імпортів, якщо він червоний
// import { AppController } from './app.controller'; 

import { RecipesModule } from './recipes/recipes.module';
// Перевір, чи правильний шлях до RecipesModule ↑
// Якщо RecipesModule лежить просто в src/recipes, то шлях буде './recipes/recipes.module'

@Module({
  imports: [RecipesModule], 
  controllers: [], 
  providers: [AppService],
})
export class AppModule {}