import { NamespaceAreaNavItem } from '../../namespaces/NamespaceArea'
import { CampaignsIconNamespaceNav } from '../campaigns/icons'

export const enterpriseNamespaceAreaHeaderNavItems: readonly NamespaceAreaNavItem[] = [
    {
        to: '/campaigns',
        label: 'Campaigns',
        icon: CampaignsIconNamespaceNav,
        condition: () => window.context.campaignsEnabled,
    },
]
