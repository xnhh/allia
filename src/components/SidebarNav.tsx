"use client"

type SidebarNavProps = {
  selectedId: string
  onSelect?: (id: string) => void
}

const NAV_ITEMS = [
  {
    id: "starknet",
    label: "Starknet",
  },
  // More items can be added here later
]

export function SidebarNav({ selectedId, onSelect }: SidebarNavProps) {
  return (
    <aside className="flex h-full min-h-screen w-56 flex-col border-r border-neutral-800 bg-black/90 text-sm text-neutral-200">
      <div className="px-4 py-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Navigation
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const selected = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={[
                "flex w-full items-center rounded-md px-3 py-2 text-left transition-colors",
                selected
                  ? "bg-lavander-sky/20 text-lavander-sky"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white",
              ].join(" ")}
            >
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}


