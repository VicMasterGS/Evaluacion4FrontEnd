import type { Ingredient } from '../types'

type ShoppingListProps = {
  shoppingList: Ingredient[]
}

export function ShoppingList({ shoppingList }: ShoppingListProps) {
  return (
    <div className="sidebar-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Lista de compras</p>
          <h2>Ingredientes del menú</h2>
        </div>
      </div>

      {shoppingList.length === 0 ? (
        <p className="empty-state">Agrega recetas al menú para generar tu lista.</p>
      ) : (
        <ul className="shopping-list">
          {shoppingList.map((ingredient) => (
            <li key={`${ingredient.name}-${ingredient.unit}`}>
              <span>{ingredient.name}</span>
              <strong>
                {ingredient.amount} {ingredient.unit}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
