import { Controller, Get, Query } from '@nestjs/common';
import { RecipesService } from './recipes/recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('search')
  async searchRecipes(@Query('ingredients') ingredients: string) {
    if (!ingredients) {
      return { recipes: [] };
    }

    const ingredientArray = ingredients.split(',').map(i => i.trim());
    const foundRecipes = await this.recipesService.findRecipesByIngredients(ingredientArray);

    // ВАЖЛИВО: Повертаємо об'єкт з полем recipes, як чекає фронтенд
    return { recipes: foundRecipes };
  }
}