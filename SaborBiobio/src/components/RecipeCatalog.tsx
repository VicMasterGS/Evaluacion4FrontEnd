import type { Recipe } from '../types'
import { RecipeCard } from './RecipeCard'

type RecipeCatalogProps = {
  recipes: Recipe[]
  loading: boolean
  error: string
  page: number
  totalRecipes: number
  favorites: number[]
  daySelection: Record<number, string>
  weekDays: readonly string[]
  onToggleFavorite: (recipeId: number) => void
  onSelectRecipe: (recipe: Recipe) => void
  onDayChange: (recipeId: number, day: string) => void
  onAddToMenu: (recipeId: number, day: string) => void
  onPageChange: (nextPage: number) => void
}

export function RecipeCatalog({
  recipes,
  loading,
  error,
  page,
  totalRecipes,
  favorites,
  daySelection,
  weekDays,
  onToggleFavorite,
  onSelectRecipe,
  onDayChange,
  onAddToMenu,
  onPageChange,
}: RecipeCatalogProps) {
  const hasPrevPage = page > 0
  const hasNextPage = (page + 1) * 8 < totalRecipes

  return (
    <section id="catalogo" className="catalog-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h2>Explora recetas desde la API</h2>
        </div>
      </div>

      {error ? <p className="status-message error">{error}</p> : null}

      {loading ? <p className="status-message">Cargando recetas…</p> : null}

      {!loading && recipes.length === 0 ? <p className="status-message">No hay recetas para mostrar con esa combinación.</p> : null}

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favorites.includes(recipe.id)}
            selectedDay={daySelection[recipe.id] ?? ''}
            weekDays={weekDays}
            onToggleFavorite={onToggleFavorite}
            onSelectRecipe={onSelectRecipe}
            onDayChange={onDayChange}
            onAddToMenu={onAddToMenu}
          />
        ))}
      </div>

      <div className="pagination">
        <button type="button" className="secondary-btn small" disabled={!hasPrevPage} onClick={() => onPageChange(Math.max(0, page - 1))}>
          Página anterior
        </button>
        <span>Página {page + 1}</span>
        <button type="button" className="secondary-btn small" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
          Siguiente página
        </button>
      </div>
    </section>
  )
}
