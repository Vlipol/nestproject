import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { translate } from 'google-translate-api-x';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  private readonly API_KEY = 'a5afef28fd234d0bb3faa90af342841c'; 
  private readonly API_URL = 'https://api.spoonacular.com/recipes/complexSearch';

  private readonly dictionary: Record<string, string> = {
    'картопля': 'potato',
    'курка': 'chicken',
    'куряче філе': 'chicken breast',
    'рис': 'rice',
    'помідор': 'tomato',
    'томати': 'tomatoes',
    'сир': 'cheese',
    'яйця': 'eggs',
    'яйце': 'egg',
    'молоко': 'milk',
    'цибуля': 'onion',
    'часник': 'garlic',
    'морква': 'carrot',
    'борошно': 'flour',
    'масло': 'butter',
    'олія': 'oil',
    'сіль': 'salt',
    'перець': 'pepper',
    'макарони': 'pasta',
    'цукор': 'sugar',
    'гриби': 'mushrooms',
    'свинина': 'pork',
    'яловичина': 'beef'
  };

  constructor(private readonly httpService: HttpService) {}

  async findRecipesByIngredients(ingredients: string[]): Promise<any[]> {
    const englishIngredients = ingredients
      .map(ing => this.dictionary[ing.toLowerCase().trim()] || ing)
      .join(',');

    this.logger.log(`🔍 Шукаю: ${ingredients} -> ${englishIngredients}`);

    if (!englishIngredients) return [];

    try {
      // !!! ЗМІНА: Додали instructionsRequired=true
      // Це змушує API не показувати рецепти без інструкції
      const url = `${this.API_URL}?includeIngredients=${englishIngredients}&instructionsRequired=true&addRecipeInformation=true&fillIngredients=true&number=3&apiKey=${this.API_KEY}`;
      
      const response = await lastValueFrom(this.httpService.get(url));
      const results = response.data.results;

      if (!results || results.length === 0) return [];

      const translatedRecipes = await Promise.all(
        results.map(async (meal) => {
          
          // Отримуємо "чистий" текст. Якщо кроків немає - повернемо порожній рядок, а не опис.
          const rawInstructions = this.getCleanInstructions(meal);
          const rawIngredients = meal.extendedIngredients?.map(ing => ing.original).join('; ') || '';

          // Якщо інструкції немає навіть англійською, ставимо заглушку перед перекладом
          const instructionsToTranslate = rawInstructions || 'No detailed instructions found for this recipe.';

          try {
            // Переклад
            const [titleRes, instrRes, ingrRes] = await Promise.all([
              translate(meal.title, { to: 'uk' }),
              translate(instructionsToTranslate, { to: 'uk' }),
              translate(rawIngredients, { to: 'uk' })
            ]);

            return {
              id: meal.id,
              title: (titleRes as any)?.text || meal.title,
              image: meal.image,
              description: `Час: ${meal.readyInMinutes} хв. Порцій: ${meal.servings}`,
              instructions: (instrRes as any)?.text || rawInstructions,
              ingredients: ((ingrRes as any)?.text || rawIngredients).split(';').map(i => i.trim())
            };

          } catch (e) {
            this.logger.error(`Помилка перекладу: ${e.message}`);
            return {
              id: meal.id,
              title: meal.title,
              image: meal.image,
              description: `Ready in ${meal.readyInMinutes} min.`,
              instructions: rawInstructions || 'Instructions not available.',
              ingredients: meal.extendedIngredients?.map(ing => ing.original) || []
            };
          }
        })
      );

      return translatedRecipes;

    } catch (error) {
      this.logger.error(`API Error: ${error.message}`);
      return [];
    }
  }

  private getCleanInstructions(meal: any): string {
    // 1. Пріоритет: Покрокова інструкція
    if (meal.analyzedInstructions?.length > 0) {
      return meal.analyzedInstructions[0].steps
        .map(s => `${s.number}. ${s.step}`)
        .join('\n');
    } 
    
    // 2. Якщо немає кроків, шукаємо текстовий блок instructions
    if (meal.instructions && meal.instructions.trim().length > 10) {
      return meal.instructions.replace(/<[^>]*>?/gm, '');
    }

    // !!! ЗМІНА: Ми БІЛЬШЕ НЕ ПОВЕРТАЄМО meal.summary
    // Якщо інструкції немає - повертаємо null, щоб не показувати опис про вітаміни
    return '';
  }
}