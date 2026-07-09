export type Ingredient = {
  name: string
  amount: number
  unit: string
}

export type Recipe = {
  id: number
  name: string
  description: string
  image: string
  cuisine: string
  mealType: string
  tags: string[]
  ingredients: Ingredient[]
  instructions: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  difficulty: string
  rating: number
  reviewCount: number
  caloriesPerServing: number
}
