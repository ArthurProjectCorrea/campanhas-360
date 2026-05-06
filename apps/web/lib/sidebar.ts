import * as React from 'react'
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
} from 'lucide-react'

export const data = {
  teams: [
    {
      name: 'Acme Inc',
      logo: React.createElement(GalleryVerticalEndIcon),
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: React.createElement(AudioLinesIcon),
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: React.createElement(TerminalIcon),
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: React.createElement(TerminalSquareIcon),
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: React.createElement(BotIcon),
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: React.createElement(BookOpenIcon),
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: React.createElement(Settings2Icon),
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: React.createElement(FrameIcon),
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: React.createElement(PieChartIcon),
    },
    {
      name: 'Travel',
      url: '#',
      icon: React.createElement(MapIcon),
    },
  ],
}
