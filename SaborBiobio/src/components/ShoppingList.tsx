import type { ShoppingListItem } from '../types'

type ShoppingListProps = {
  shoppingList: ShoppingListItem[]
  onGenerateFromMenu: () => void
  onTogglePurchased: (name: string, unit: string) => void
  onRemoveItem: (name: string, unit: string) => void
  onClearList: () => void
}

export function ShoppingList({ shoppingList, onGenerateFromMenu, onTogglePurchased, onRemoveItem, onClearList }: ShoppingListProps) {
  return (
    <div className="sidebar-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Lista de compras</p>
          <h2>Ingredientes del menú</h2>
        </div>
        <button type="button" className="secondary-btn small" onClick={onGenerateFromMenu}>
          Generar lista
        </button>
      </div>

      {shoppingList.length === 0 ? (
        <div className="empty-state">
          <p>Genera una lista a partir del menú semanal o deja esta sección vacía si prefieres crearla manualmente.</p>
        </div>
      ) : (
        <>
          <ul className="shopping-list">
            {shoppingList.map((ingredient) => (
              <li key={`${ingredient.name}-${ingredient.unit}`}>
                <button type="button" className="secondary-btn small" onClick={() => onTogglePurchased(ingredient.name, ingredient.unit)}>
                  {ingredient.purchased ? '✓' : '○'}
                </button>
                <div>
                  <span className={ingredient.purchased ? 'is-complete' : ''}>{ingredient.name}</span>
                  <strong>
                    {ingredient.amount} {ingredient.unit}
                  </strong>
                </div>
                <button type="button" className="secondary-btn small" onClick={() => onRemoveItem(ingredient.name, ingredient.unit)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="secondary-btn small" onClick={onClearList}>
            Vaciar lista
          </button>
        </>
      )}
    </div>
  )
}
