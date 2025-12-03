import { Controller, Get, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('search')
  async searchRecipes(@Query('ingredients') ingredients: string) {
    // Якщо інгредієнтів немає
    if (!ingredients) {
      return { recipes: [] };
    }

    const ingredientArray = ingredients.split(',').map(i => i.trim());
    
    // Отримуємо рецепти від сервісу
    const foundRecipes = await this.recipesService.findRecipesByIngredients(ingredientArray);

    // !!! ГОЛОВНЕ: Повертаємо об'єкт { recipes: ... }, щоб фронтенд його зрозумів
    return { recipes: foundRecipes };
  }
}