import { StarknetDapp } from "@/modules/starknet/pages/StarknetDapp"
import { Header } from "@/modules/starknet/components/Header"
import { Deployment } from "@/modules/starknet/pages/Deployment/Deployment"

// 路由配置类型
export type RouteId = "deployment" | "todo"

export interface RouteConfig {
  id: RouteId
  component: React.ComponentType
  layout?: React.ComponentType<{ children: React.ReactNode }>
}

// 路由配置映射
const routes: Record<RouteId, RouteConfig> = {
  deployment: {
    id: "deployment",
    component: Deployment,
    layout: ({ children }) => (
      <div className="flex flex-col min-h-screen bg-black">
        <Header />
        <div className="flex-1 px-5 md:px-[116px] pb-8">{children}</div>
      </div>
    ),
  },
  todo: {
    id: "todo",
    component: StarknetDapp,
  },
}

// 默认路由
const DEFAULT_ROUTE: RouteId = "deployment"

/**
 * 获取路由配置
 */
export function getRoute(routeId?: string): RouteConfig {
  const id = (routeId as RouteId) || DEFAULT_ROUTE
  return routes[id] || routes[DEFAULT_ROUTE]
}

/**
 * 渲染路由组件
 */
export function renderRoute(routeId?: string) {
  const route = getRoute(routeId)
  const Component = route.component

  if (route.layout) {
    const Layout = route.layout
    return (
      <Layout>
        <Component />
      </Layout>
    )
  }

  return <Component />
}
