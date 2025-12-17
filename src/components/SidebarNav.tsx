"use client"

import { useState } from "react"

type SubNavItem = {
  id: string
  label: string
}

type NavItem = {
  id: string
  label: string
  subItems?: SubNavItem[]
}

type SidebarNavProps = {
  selectedId: string
  selectedSubId?: string
  onSelect?: (id: string, subId?: string) => void
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "starknet",
    label: "Starknet",
    subItems: [
      { id: "deployment", label: "Deployment" },
      { id: "todo", label: "TODO" },
    ],
  },
  // More items can be added here later
]

export function SidebarNav({
  selectedId,
  selectedSubId,
  onSelect,
}: SidebarNavProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["starknet"]),
  )

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleItemClick = (item: NavItem) => {
    if (item.subItems && item.subItems.length > 0) {
      toggleExpand(item.id)
    } else {
      onSelect?.(item.id)
    }
  }

  const handleSubItemClick = (parentId: string, subId: string) => {
    onSelect?.(parentId, subId)
  }

  return (
    <aside className="flex h-full min-h-screen w-56 flex-col border-r border-neutral-800 bg-black/90 text-sm text-neutral-200">
      <div className="px-4 py-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Navigation
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isExpanded = expandedItems.has(item.id)
          const hasSubItems = item.subItems && item.subItems.length > 0

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className={[
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
                  selectedId === item.id && !selectedSubId
                    ? "bg-lavander-sky/20 text-lavander-sky"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white",
                ].join(" ")}
              >
                <span className="truncate">{item.label}</span>
                {hasSubItems && (
                  <svg
                    className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>

              {/* Sub items */}
              {hasSubItems && isExpanded && (
                <div className="ml-3 mt-1 space-y-1 border-l border-neutral-700 pl-3">
                  {item.subItems!.map((subItem) => {
                    const isSubSelected =
                      selectedId === item.id && selectedSubId === subItem.id
                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() => handleSubItemClick(item.id, subItem.id)}
                        className={[
                          "flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                          isSubSelected
                            ? "bg-lavander-sky/20 text-lavander-sky"
                            : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                        ].join(" ")}
                      >
                        <span className="truncate">{subItem.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
