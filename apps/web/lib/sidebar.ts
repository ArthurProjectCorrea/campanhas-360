import { Screen, NavMainItem } from '@/types'

interface TemplateItem {
  key?: string
  name?: string
  url?: string
  icon?: string
  isActive?: boolean
  items?: { key: string; url: string }[]
}

export const getNavMain = (permittedScreens: Screen[], domain: string): NavMainItem[] => {
  // O template define a ORDEM, a ESTRUTURA e as URLs da sidebar
  const template: TemplateItem[] = [
    {
      key: 'dashboard',
      url: `/${domain}/dashboard`,
    },
    {
      key: 'regional_planning',
      url: `/${domain}/regional-planning`,
    },
    {
      key: 'map',
      url: `/${domain}/map`,
    },
    {
      name: 'Configurações',
      icon: 'settings',
      items: [
        {
          key: 'organization_profile',
          url: `/${domain}/settings/organization-profile`,
        },
        {
          key: 'user_registration',
          url: `/${domain}/settings/user-registration`,
        },
        {
          key: 'access_profile',
          url: `/${domain}/settings/access-profile`,
        },
      ],
    },
  ]

  const mappedItems: (NavMainItem | null)[] = template.map(item => {
    // Se for um grupo com sub-itens
    if (item.items) {
      const subItems = item.items
        .map(sub => {
          const screen = permittedScreens.find(s => s.key === sub.key)
          if (!screen) return null
          return {
            title: screen.sidebar || screen.title,
            url: sub.url,
            icon: screen.icon,
          }
        })
        .filter((sub): sub is NonNullable<typeof sub> => sub !== null)

      // Se o grupo não tiver nenhum item permitido, oculta o grupo todo
      if (subItems.length === 0) return null

      return {
        title: item.name || '',
        icon: item.icon,
        isActive: item.isActive,
        items: subItems,
      }
    }

    // Se for um item simples
    const screen = permittedScreens.find(s => s.key === item.key)
    if (!screen) return null

    return {
      title: screen.sidebar || screen.title,
      url: item.url || `/${domain}/${screen.key}`,
      icon: screen.icon,
    }
  })

  return mappedItems.filter((item): item is NavMainItem => item !== null)
}

export const data = {
  // Mantemos o objeto data para outros usos se necessário,
  // mas o navMain agora é gerado dinamicamente via getNavMain
  teams: [],
  projects: [],
}
