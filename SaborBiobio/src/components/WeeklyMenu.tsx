import type { Recipe } from '../types'

type WeeklyMenuProps = {
  weekDays: readonly string[]
  weeklyMenu: Record<string, number | null>
  recipes: Recipe[]
}

export function WeeklyMenu({ weekDays, weeklyMenu, recipes }: WeeklyMenuProps) {
  return (
    <div className="planner-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plan semanal</p>
          <h2>Tu menú de la semana</h2>
        </div>
      </div>

      <div className="week-grid">
        {weekDays.map((day) => {
          const recipeId = weeklyMenu[day]
          const recipe = recipes.find((item) => item.id === recipeId) ?? null
          return (
            <div className="day-card" key={day}>
              <h3>{day}</h3>
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
