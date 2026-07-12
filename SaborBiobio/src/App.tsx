import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { RecipeCatalog } from './components/RecipeCatalog'
import { ShoppingList } from './components/ShoppingList'
import { WeeklyMenu } from './components/WeeklyMenu'
import type { Ingredient, Recipe, ShoppingListItem } from './types'
import './App.css'

type RecipesApiResponse = {
  recipes?: unknown[]
  total?: number
  skip?: number
  limit?: number
}

type PersistedState = {
  favorites: number[]
  weeklyMenu: Record<string, number | null>
  shoppingList: ShoppingListItem[]
}

const STORAGE_KEY = 'saborbiobio-state-v1'
const PAGE_SIZE = 8
const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
const VALID_MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] as const
const MEAL_TYPE_LABELS: Record<(typeof VALID_MEAL_TYPES)[number], string> = {
  Breakfast: 'Desayuno',
  Lunch: 'Almuerzo',
  Dinner: 'Cena',
  Snack: 'Snack',
  Dessert: 'Postre',
}

const FALLBACK_RECIPES: Recipe[] = [
  {
    id: 1001,
    name: 'Ensalada de quinoa biobío',
    description: 'Una opción fresca con verduras locales y proteína vegetal.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    cuisine: 'Biobío',
    mealType: 'Lunch',
    tags: ['Vegetarian', 'Healthy', 'Summer'],
    ingredients: [
      { name: 'Quinoa', amount: 200, unit: 'g' },
      { name: 'Tomate', amount: 2, unit: 'unidades' },
      { name: 'Pepino', amount: 1, unit: 'unidad' },
    ],
    instructions: ['Cocina la quinoa.', 'Mezcla con verduras y aliña.'],
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'Easy',
    rating: 4.7,
    reviewCount: 18,
    caloriesPerServing: 340,
  },
  {
    id: 1002,
    name: 'Tortilla de verduras regional',
    description: 'Ideal para el almuerzo con ingredientes simples y muy sabrosos.',
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=900&q=80',
    cuisine: 'Biobío',
    mealType: 'Dinner',
    tags: ['Vegetarian', 'Comfort', 'Dinner'],
    ingredients: [
      { name: 'Huevos', amount: 4, unit: 'unidades' },
      { name: 'Zanahoria', amount: 1, unit: 'unidad' },
      { name: 'Cebolla', amount: 1, unit: 'unidad' },
    ],
    instructions: ['Saltea las verduras.', 'Agrega los huevos y cocina a fuego bajo.'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'Easy',
    rating: 4.6,
    reviewCount: 12,
    caloriesPerServing: 290,
  },
  {
    id: 1003,
    name: 'Pancakes de avena',
    description: 'Desayuno energético con fruta fresca y un toque natural de canela.',
    image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=900&q=80',
    cuisine: 'Biobío',
    mealType: 'Breakfast',
    tags: ['Breakfast', 'Healthy', 'Sweet'],
    ingredients: [
      { name: 'Avena', amount: 150, unit: 'g' },
      { name: 'Plátano', amount: 1, unit: 'unidad' },
      { name: 'Leche', amount: 250, unit: 'ml' },
    ],
    instructions: ['Mezcla los ingredientes.', 'Cocina por ambos lados.'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'Easy',
    rating: 4.8,
    reviewCount: 21,
    caloriesPerServing: 260,
  },
]

function getFallbackRecipes(): Recipe[] {
  return FALLBACK_RECIPES.map((recipe) => ({ ...recipe }))
}

function sanitizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function sanitizePositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

function sanitizeWeeklyMenu(value: unknown): Record<string, number | null> {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const seenRecipeIds = new Set<number>()
  const nextMenu: Record<string, number | null> = {}

  Object.entries(value as Record<string, unknown>).forEach(([day, recipeId]) => {
    if (!WEEK_DAYS.includes(day as (typeof WEEK_DAYS)[number])) {
      return
    }

    const parsedRecipeId = sanitizePositiveInteger(recipeId)
    if (parsedRecipeId === null || seenRecipeIds.has(parsedRecipeId)) {
      return
    }

    seenRecipeIds.add(parsedRecipeId)
    nextMenu[day] = parsedRecipeId
  })

  return nextMenu
}

function normalizeShoppingListItems(items: ShoppingListItem[]): ShoppingListItem[] {
  const aggregatedItems = new Map<string, ShoppingListItem>()

  items.forEach((item) => {
    const normalizedItem = sanitizeShoppingListItem(item)
    if (!normalizedItem) {
      return
    }

    const key = `${normalizedItem.name.trim().toLowerCase()}::${normalizedItem.unit.trim().toLowerCase()}`
    const existing = aggregatedItems.get(key)

    if (existing) {
      existing.amount += normalizedItem.amount
    } else {
      aggregatedItems.set(key, {
        name: normalizedItem.name.trim(),
        unit: normalizedItem.unit.trim(),
        amount: normalizedItem.amount,
        purchased: normalizedItem.purchased,
      })
    }
  })

  return Array.from(aggregatedItems.values()).sort((first, second) => first.name.localeCompare(second.name))
}

function sanitizeIngredient(value: unknown): Ingredient | null {
  if (typeof value === 'string') {
    const name = sanitizeString(value)
    if (!name) {
      return null
    }

    return {
      name,
      amount: 1,
      unit: 'unidad',
    }
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const amount = typeof candidate.amount === 'number' ? candidate.amount : Number(candidate.amount)
  const unit = sanitizeString(candidate.unit, 'unidad')
  const name = sanitizeString(candidate.name, 'Ingrediente')

  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return {
    name,
    amount,
    unit,
  }
}

function sanitizeShoppingListItem(value: unknown): ShoppingListItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const amount = typeof candidate.amount === 'number' ? candidate.amount : Number(candidate.amount)
  const unit = sanitizeString(candidate.unit, 'unidad')
  const name = sanitizeString(candidate.name, 'Ingrediente')
  const purchased = typeof candidate.purchased === 'boolean' ? candidate.purchased : false

  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return {
    name,
    amount,
    unit,
    purchased,
  }
}

function sanitizeRecipe(value: unknown): Recipe | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const id = sanitizePositiveInteger(candidate.id)
  if (id === null) {
    return null
  }

  const ingredients = Array.isArray(candidate.ingredients)
    ? candidate.ingredients.map(sanitizeIngredient).filter((ingredient): ingredient is Ingredient => Boolean(ingredient))
    : []

  const instructions = Array.isArray(candidate.instructions)
    ? candidate.instructions.map((instruction) => sanitizeString(instruction)).filter(Boolean)
    : []

  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.map((tag) => sanitizeString(tag)).filter(Boolean).slice(0, 8)
    : []

  return {
    id,
    name: sanitizeString(candidate.name, `Receta ${id}`),
    description: sanitizeString(candidate.description, 'Descripción disponible próximamente.'),
    image: sanitizeString(candidate.image, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80'),
    cuisine: sanitizeString(candidate.cuisine, 'Biobío'),
    mealType: sanitizeString(candidate.mealType, 'Dinner'),
    tags,
    ingredients,
    instructions,
    prepTimeMinutes: typeof candidate.prepTimeMinutes === 'number' ? candidate.prepTimeMinutes : 20,
    cookTimeMinutes: typeof candidate.cookTimeMinutes === 'number' ? candidate.cookTimeMinutes : 20,
    servings: typeof candidate.servings === 'number' ? candidate.servings : 2,
    difficulty: sanitizeString(candidate.difficulty, 'Easy'),
    rating: typeof candidate.rating === 'number' ? Math.max(0, Math.min(5, candidate.rating)) : 4.5,
    reviewCount: typeof candidate.reviewCount === 'number' ? candidate.reviewCount : 0,
    caloriesPerServing: typeof candidate.caloriesPerServing === 'number' ? candidate.caloriesPerServing : 320,
  }
}

function sanitizePersistedState(value: unknown): PersistedState {
  if (!value || typeof value !== 'object') {
    return { favorites: [], weeklyMenu: {}, shoppingList: [] }
  }

  const candidate = value as Record<string, unknown>
  const favorites = Array.isArray(candidate.favorites)
    ? candidate.favorites.map((entry) => sanitizePositiveInteger(entry)).filter((entry): entry is number => entry !== null)
    : []

  const weeklyMenu = sanitizeWeeklyMenu(candidate.weeklyMenu)

  const shoppingList = Array.isArray(candidate.shoppingList)
    ? normalizeShoppingListItems(candidate.shoppingList.map(sanitizeShoppingListItem).filter((item): item is ShoppingListItem => Boolean(item)))
    : []

  return {
    favorites: Array.from(new Set(favorites)).slice(0, 24),
    weeklyMenu,
    shoppingList,
  }
}

function loadPersistedState(): PersistedState {
  if (typeof window === 'undefined') {
    return { favorites: [], weeklyMenu: {}, shoppingList: [] }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw || raw.trim() === '') {
      return { favorites: [], weeklyMenu: {}, shoppingList: [] }
    }

    return sanitizePersistedState(JSON.parse(raw))
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Se ignora si el navegador no permite limpiar el almacenamiento.
    }
    return { favorites: [], weeklyMenu: {}, shoppingList: [] }
  }
}

function savePersistedState(state: PersistedState): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Se ignora para no romper la experiencia si el navegador rechaza el almacenamiento.
  }
}

function buildShoppingListFromMenu(recipes: Recipe[], previousList: ShoppingListItem[] = []): ShoppingListItem[] {
  const itemsByKey = new Map<string, ShoppingListItem>()
  const previousItems = new Map(previousList.map((item) => [`${item.name.trim().toLowerCase()}::${item.unit.trim().toLowerCase()}`, item]))

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = `${ingredient.name.trim().toLowerCase()}::${ingredient.unit.trim().toLowerCase()}`
      const previousItem = previousItems.get(key)
      const existingItem = itemsByKey.get(key)

      if (existingItem) {
        existingItem.amount += ingredient.amount
      } else {
        itemsByKey.set(key, {
          name: ingredient.name.trim(),
          amount: ingredient.amount,
          unit: ingredient.unit.trim(),
          purchased: previousItem?.purchased ?? false,
        })
      }
    })
  })

  return normalizeShoppingListItems(Array.from(itemsByKey.values()))
}

function App() {
  const fallbackRecipes = useMemo(() => getFallbackRecipes(), [])
  const [recipes, setRecipes] = useState<Recipe[]>(fallbackRecipes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestStatus, setRequestStatus] = useState<'idle' | 'ok' | 'fallback' | 'error'>('idle')
  const [tags, setTags] = useState<string[]>([])
  const [favorites, setFavorites] = useState<number[]>(() => loadPersistedState().favorites)
  const [weeklyMenu, setWeeklyMenu] = useState<Record<string, number | null>>(() => loadPersistedState().weeklyMenu)
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => loadPersistedState().shoppingList)
  const [recipeLibrary, setRecipeLibrary] = useState<Record<number, Recipe>>(() => {
    const entries = fallbackRecipes.map((recipe) => [recipe.id, recipe] as const)
    return Object.fromEntries(entries)
  })
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [activeFilter, setActiveFilter] = useState<'default' | 'search' | 'tag' | 'meal'>('default')
  const [activeTag, setActiveTag] = useState('')
  const [activeMealType, setActiveMealType] = useState('')
  const [daySelection, setDaySelection] = useState<Record<number, string>>({})
  const [storageNotice, setStorageNotice] = useState('')

  useEffect(() => {
    savePersistedState({ favorites, weeklyMenu, shoppingList })
    setStorageNotice('Menú semanal, favoritos y lista de compras guardados en Local Storage.')
  }, [favorites, weeklyMenu, shoppingList])

  useEffect(() => {
    const controller = new AbortController()

    async function loadTags() {
      try {
        const response = await fetch('https://dummyjson.com/recipes/tags', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('No se pudieron cargar las etiquetas')
        }
        const payload = (await response.json()) as string[]
        setTags(Array.isArray(payload) ? payload.filter((tag): tag is string => typeof tag === 'string') : [])
      } catch {
        setTags([])
      }
    }

    void loadTags()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadRecipes() {
      setLoading(true)
      setError('')

      try {
        let url = `https://dummyjson.com/recipes?limit=${PAGE_SIZE}&skip=${page * PAGE_SIZE}`

        if (activeFilter === 'search' && query.trim()) {
          url = `https://dummyjson.com/recipes/search?q=${encodeURIComponent(query.trim())}`
        } else if (activeFilter === 'tag' && activeTag) {
          url = `https://dummyjson.com/recipes/tag/${encodeURIComponent(activeTag)}`
        } else if (activeFilter === 'meal' && activeMealType) {
          url = `https://dummyjson.com/recipes/meal-type/${encodeURIComponent(activeMealType)}`
        }

        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Respuesta inválida de la API: ${response.status}`)
        }

        const payload = (await response.json()) as RecipesApiResponse
        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.recipes)) {
          throw new Error('La estructura de la respuesta no es válida')
        }

        const nextRecipes = payload.recipes.map(sanitizeRecipe).filter((recipe): recipe is Recipe => Boolean(recipe))

        if (nextRecipes.length > 0) {
          setRecipes(nextRecipes)
          setRecipeLibrary((current) => {
            const next = { ...current }
            nextRecipes.forEach((recipe) => {
              next[recipe.id] = recipe
            })
            return next
          })
          setTotalRecipes(typeof payload.total === 'number' ? payload.total : nextRecipes.length)
          setError('')
          setRequestStatus('ok')
        } else {
          const fallbackRecipes = getFallbackRecipes()
          setRecipes(fallbackRecipes)
          setRecipeLibrary((current) => {
            const next = { ...current }
            fallbackRecipes.forEach((recipe) => {
              next[recipe.id] = recipe
            })
            return next
          })
          setTotalRecipes(fallbackRecipes.length)
          setError('La API no devolvió resultados; mostramos recetas de respaldo.')
          setRequestStatus('fallback')
        }
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          const fallbackRecipes = getFallbackRecipes()
          setRecipes(fallbackRecipes)
          setRecipeLibrary((current) => {
            const next = { ...current }
            fallbackRecipes.forEach((recipe) => {
              next[recipe.id] = recipe
            })
            return next
          })
          setTotalRecipes(fallbackRecipes.length)
          setError('No fue posible contactar a la API; se muestran recetas de respaldo.')
          setRequestStatus('error')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadRecipes()
    return () => controller.abort()
  }, [activeFilter, activeMealType, activeTag, page, query])

  useEffect(() => {
    const selectedRecipeId = selectedRecipe?.id
    if (!selectedRecipeId) {
      return
    }

    const controller = new AbortController()

    async function loadDetail() {
      setDetailLoading(true)
      try {
        const response = await fetch(`https://dummyjson.com/recipes/${selectedRecipeId}`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error('No se pudo cargar el detalle')
        }

        const payload = sanitizeRecipe(await response.json())
        if (payload) {
          setSelectedRecipe(payload)
          setRecipeLibrary((current) => ({ ...current, [payload.id]: payload }))
        }
      } catch {
        setSelectedRecipe((current) => current ?? null)
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false)
        }
      }
    }

    void loadDetail()
    return () => controller.abort()
  }, [selectedRecipe?.id])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedQuery = query.trim()
    setActiveFilter(trimmedQuery ? 'search' : 'default')
    setActiveTag('')
    setActiveMealType('')
    setPage(0)
  }

  function handleResetFilters() {
    setQuery('')
    setActiveFilter('default')
    setActiveTag('')
    setActiveMealType('')
    setPage(0)
  }

  function toggleFavorite(recipeId: number) {
    setFavorites((current) => {
      if (current.includes(recipeId)) {
        return current.filter((id) => id !== recipeId)
      }
      return [...current, recipeId]
    })
  }

  function assignRecipeToDay(recipeId: number, day: string) {
    if (!WEEK_DAYS.includes(day as (typeof WEEK_DAYS)[number])) {
      return
    }

    setWeeklyMenu((current) => {
      const nextMenu = { ...current }
      for (const [existingDay, existingRecipeId] of Object.entries(nextMenu)) {
        if (existingRecipeId === recipeId) {
          delete nextMenu[existingDay]
        }
      }
      nextMenu[day] = recipeId
      return sanitizeWeeklyMenu(nextMenu)
    })
  }

  function removeRecipeFromDay(day: string) {
    if (!WEEK_DAYS.includes(day as (typeof WEEK_DAYS)[number])) {
      return
    }

    setWeeklyMenu((current) => {
      const nextMenu = { ...current }
      delete nextMenu[day]
      return nextMenu
    })
  }

  function clearWeeklyMenu() {
    setWeeklyMenu({})
  }

  function toggleShoppingItemPurchased(name: string, unit: string) {
    setShoppingList((current) =>
      current.map((item) =>
        item.name === name && item.unit === unit ? { ...item, purchased: !item.purchased } : item,
      ),
    )
  }

  function removeShoppingItem(name: string, unit: string) {
    setShoppingList((current) => current.filter((item) => !(item.name === name && item.unit === unit)))
  }

  function clearShoppingList() {
    setShoppingList([])
  }

  const favoriteRecipes = useMemo(
    () => recipes.filter((recipe) => favorites.includes(recipe.id)),
    [favorites, recipes],
  )

  const menuRecipes = useMemo(() => {
    const ids = Object.values(weeklyMenu).filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)
    const uniqueIds = Array.from(new Set(ids))
    return uniqueIds
      .map((recipeId) => recipeLibrary[recipeId] ?? recipes.find((recipe) => recipe.id === recipeId))
      .filter((recipe): recipe is Recipe => Boolean(recipe))
  }, [recipeLibrary, recipes, weeklyMenu])

  useEffect(() => {
    if (menuRecipes.length === 0) {
      return
    }

    setShoppingList((current) => buildShoppingListFromMenu(menuRecipes, current))
  }, [menuRecipes])

  function handleGenerateShoppingList() {
    const nextList = buildShoppingListFromMenu(menuRecipes, shoppingList)
    setShoppingList(nextList)
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Sabor Biobío</p>
          <h1>Planifica tus menús y compra con inteligencia</h1>
          <p className="hero-copy">
            Descubre recetas inspiradas en la cocina regional, arma tu menú semanal y genera una lista de compras a partir de los ingredientes que ya elegiste.
          </p>
          <div className="hero-actions">
            <a href="#catalogo" className="primary-btn">Ver recetas</a>
            <a href="#planificacion" className="secondary-btn">Ir al plan semanal</a>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{recipes.length}</strong>
            <span>recetas del día</span>
          </div>
          <div>
            <strong>{favorites.length}</strong>
            <span>favoritas</span>
          </div>
          <div>
            <strong>{menuRecipes.length}</strong>
            <span>en tu menú</span>
          </div>
        </div>
      </header>

      <section className="info-grid">
        <article className="info-card">
          <h2>Qué ofrece SaborBiobío</h2>
          <p>Un servicio de cajas de ingredientes y planificación de menús semanales que nace para facilitar cocinar mejor en la región del Biobío.</p>
        </article>
        <article className="info-card">
          <h2>Tu experiencia queda solo en este navegador</h2>
          <p>Los favoritos, el menú semanal y la lista de compras se guardan con Local Storage y se validan para evitar datos manipulados.</p>
        </article>
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2>Explora recetas desde la API</h2>
          </div>
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
              aria-label="Buscar recetas"
            />
            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="filters">
          <select
            value={activeTag}
            onChange={(event) => {
              const nextTag = event.target.value
              setActiveTag(nextTag)
              setActiveMealType('')
              setActiveFilter(nextTag ? 'tag' : 'default')
              setPage(0)
            }}
          >
            <option value="">Todas las etiquetas</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <select
            value={activeMealType}
            onChange={(event) => {
              const nextMealType = event.target.value
              setActiveMealType(nextMealType)
              setActiveTag('')
              setActiveFilter(nextMealType ? 'meal' : 'default')
              setPage(0)
            }}
          >
            <option value="">Todos los tipos</option>
            {VALID_MEAL_TYPES.map((mealType) => (
              <option key={mealType} value={mealType}>
                {MEAL_TYPE_LABELS[mealType]}
              </option>
            ))}
          </select>

          <button type="button" className="secondary-btn small" onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </div>

        {storageNotice ? <p className="status-message">{storageNotice}</p> : null}
        {requestStatus !== 'idle' ? (
          <p className={`status-message ${requestStatus === 'error' ? 'error' : ''}`}>
            {requestStatus === 'ok' ? 'Catálogo cargado correctamente desde la API.' : requestStatus === 'fallback' ? 'La API devolvió una respuesta incompleta; se está mostrando contenido de respaldo.' : 'Se activó el modo de respaldo por un problema de conexión o respuesta.'}
          </p>
        ) : null}

        <RecipeCatalog
          recipes={recipes}
          loading={loading}
          error={error}
          page={page}
          totalRecipes={totalRecipes}
          favorites={favorites}
          daySelection={daySelection}
          weekDays={WEEK_DAYS}
          onToggleFavorite={toggleFavorite}
          onSelectRecipe={setSelectedRecipe}
          onDayChange={(recipeId, day) => setDaySelection((current) => ({ ...current, [recipeId]: day }))}
          onAddToMenu={(recipeId, day) => assignRecipeToDay(recipeId, day)}
          onPageChange={(nextPage) => setPage(nextPage)}
        />
      </section>

      <section id="planificacion" className="planner-section">
        <WeeklyMenu
          weekDays={WEEK_DAYS}
          weeklyMenu={weeklyMenu}
          recipes={recipes}
          onRemoveRecipeFromDay={removeRecipeFromDay}
          onClearMenu={clearWeeklyMenu}
        />

        <aside>
          <ShoppingList
        shoppingList={shoppingList}
        onGenerateFromMenu={handleGenerateShoppingList}
        onTogglePurchased={toggleShoppingItemPurchased}
        onRemoveItem={removeShoppingItem}
        onClearList={clearShoppingList}
      />

          <div className="sidebar-panel favorites-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Favoritas</p>
                <h2>Recetas que vuelven</h2>
              </div>
            </div>
            {favoriteRecipes.length === 0 ? (
              <p className="empty-state">Marca recetas como favoritas para encontrarlas rápido.</p>
            ) : (
              <ul className="favorites-list">
                {favoriteRecipes.map((recipe) => (
                  <li key={recipe.id}>{recipe.name}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Detalle</p>
            <h2>{selectedRecipe ? selectedRecipe.name : 'Selecciona una receta'}</h2>
          </div>
        </div>

        {detailLoading ? <p className="status-message">Cargando detalle…</p> : null}
        {!selectedRecipe ? (
          <p className="empty-state">Haz clic en “Ver detalles” para ver información completa y pasos de preparación.</p>
        ) : (
          <div className="detail-card">
            <img src={selectedRecipe.image} alt={selectedRecipe.name} />
            <div>
              <p className="recipe-meta">{selectedRecipe.cuisine} · {selectedRecipe.mealType}</p>
              <p>{selectedRecipe.description}</p>
              <p className="detail-meta">Prep: {selectedRecipe.prepTimeMinutes} min · Cocción: {selectedRecipe.cookTimeMinutes} min · Porciones: {selectedRecipe.servings}</p>
              <h3>Ingredientes</h3>
              <ul>
                {selectedRecipe.ingredients.map((ingredient) => (
                  <li key={`${selectedRecipe.id}-${ingredient.name}`}>
                    {ingredient.amount} {ingredient.unit} · {ingredient.name}
                  </li>
                ))}
              </ul>
              <h3>Pasos</h3>
              <ol>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <li key={`${selectedRecipe.id}-${index}`}>{instruction}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
