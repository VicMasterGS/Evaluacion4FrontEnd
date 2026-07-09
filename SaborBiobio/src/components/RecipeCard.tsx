import type { Recipe } from '../types'

type RecipeCardProps = {
  recipe: Recipe
  isFavorite: boolean
  selectedDay: string
  weekDays: readonly string[]
  onToggleFavorite: (recipeId: number) => void
  onSelectRecipe: (recipe: Recipe) => void
  onDayChange: (recipeId: number, day: string) => void
  onAddToMenu: (recipeId: number, day: string) => void
}

export function RecipeCard({
  recipe,
  isFavorite,
  selectedDay,
  weekDays,
  onToggleFavorite,
  onSelectRecipe,
  onDayChange,
  onAddToMenu,
}: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <img src={recipe.image} alt={recipe.name} />
      <div className="recipe-content">
        <div className="recipe-header">
          <div>
            <p className="recipe-meta">
              {recipe.cuisine} · {recipe.mealType}
            </p>
            <h3>{recipe.name}</h3>
          </div>
          <button
            type="button"
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(recipe.id)}
            aria-label={`Marcar ${recipe.name} como favorita`}
          >
            ♥
          </button>
        </div>

        <p>{recipe.description}</p>
        <div className="tags">
          {recipe.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="recipe-footer">
          <div className="metadata">
            <span>{recipe.prepTimeMinutes} min</span>
            <span>{recipe.servings} porciones</span>
            <span>{recipe.difficulty}</span>
            <span>{recipe.caloriesPerServing} kcal</span>
          </div>
          <div className="card-actions">
            <button type="button" className="secondary-btn small" onClick={() => onSelectRecipe(recipe)}>
              Ver detalles
            </button>
            <div className="menu-select-row">
              <select value={selectedDay} onChange={(event) => onDayChange(recipe.id, event.target.value)}>
                <option value="">Día</option>
                {weekDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="primary-btn small"
                onClick={() => {
                  if (selectedDay) {
                    onAddToMenu(recipe.id, selectedDay)
                  }
                }}
              >
                Añadir al menú
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
