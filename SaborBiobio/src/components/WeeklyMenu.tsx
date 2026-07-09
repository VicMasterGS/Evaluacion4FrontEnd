import type { Recipe } from '../types'

type WeeklyMenuProps = {
  weekDays: readonly string[]
  weeklyMenu: Record<string, number | null>
  recipes: Recipe[]
  onRemoveRecipeFromDay: (day: string) => void
  onClearMenu: () => void
}

export function WeeklyMenu({ weekDays, weeklyMenu, recipes, onRemoveRecipeFromDay, onClearMenu }: WeeklyMenuProps) {
  return (
    <div className="planner-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plan semanal</p>
          <h2>Tu menú de la semana</h2>
        </div>
        <button type="button" className="secondary-btn small" onClick={onClearMenu}>
          Vaciar menú
        </button>
      </div>

      <div className="week-grid">
        {weekDays.map((day) => {
          const recipeId = weeklyMenu[day]
          const recipe = recipes.find((item) => item.id === recipeId) ?? null
          return (
            <div className="day-card" key={day}>
              <div className="recipe-header">
                <h3>{day}</h3>
                {recipe ? (
                  <button type="button" className="secondary-btn small" onClick={() => onRemoveRecipeFromDay(day)}>
                    Quitar
                  </button>
                ) : null}
              </div>
              {recipe ? (
                <>
                  <p>{recipe.name}</p>
                  <span>{recipe.mealType}</span>
                </>
              ) : (
                <p className="empty-state">Sin receta asignada</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
