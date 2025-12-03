// src/cookify-backend/recipes/recipes.module.ts
import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { HttpModule } from '@nestjs/axios'; // <--- ВАЖЛИВО

@Module({
  imports: [HttpModule], // <--- ВАЖЛИВО: додай це сюди
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}