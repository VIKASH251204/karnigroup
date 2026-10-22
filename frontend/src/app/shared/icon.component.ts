import { Component, Input } from '@angular/core';

/** SVG icon set (Lucide-style, stroke based). Usage: <app-icon name="home" /> */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
         [attr.stroke]="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         [style.flex-shrink]="'0'" [attr.aria-hidden]="'true'">
      @for (p of paths(); track p) {
        @if (p.startsWith('circle:')) {
          <circle [attr.cx]="p.split(':')[1]" [attr.cy]="p.split(':')[2]" [attr.r]="p.split(':')[3]" />
        } @else if (p.startsWith('rect:')) {
          <rect [attr.x]="p.split(':')[1]" [attr.y]="p.split(':')[2]" [attr.width]="p.split(':')[3]"
                [attr.height]="p.split(':')[4]" [attr.rx]="p.split(':')[5]" />
        } @else {
          <path [attr.d]="p" />
        }
      }
    </svg>
  `
})
export class IconComponent {
  @Input() name = 'home';
  @Input() size = 20;
  @Input() color = 'currentColor';

  paths(): string[] {
    return ICONS[this.name] ?? ICONS['circle'];
  }
}

const ICONS: Record<string, string[]> = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h5v-6h4v6h5V9.5'],
  user: ['circle:12:8:4', 'M4.5 21a7.5 7.5 0 0 1 15 0'],
  users: ['circle:9:8:3.6', 'M2.5 21a6.5 6.5 0 0 1 13 0', 'M16 4.6a3.6 3.6 0 0 1 0 6.9', 'M18 14.2a6.5 6.5 0 0 1 3.5 5.8'],
  'user-plus': ['circle:9:8:4', 'M2.5 21a7 7 0 0 1 12.2-4.7', 'M19 8v6', 'M22 11h-6'],
  'user-check': ['circle:9:8:4', 'M2.5 21a7 7 0 0 1 12.2-4.7', 'm16.5 11.5 2 2 4-4.5'],
  trophy: ['M6 9a6 6 0 0 0 12 0V4H6z', 'M6 5H3v2a4 4 0 0 0 3.5 4', 'M18 5h3v2a4 4 0 0 1-3.5 4', 'M9 21h6', 'M12 15v6', 'M8 21h8'],
  wallet: ['M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 9h18', 'M16 14h2'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  'trending-up': ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  rupee: ['M6 3h12', 'M6 8h12', 'm6 13 8.5 8', 'M6 13h3', 'M9 13c6.667 0 6.667-10 0-10'],
  file: ['M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M9 13h6', 'M9 17h6'],
  settings: ['circle:12:12:3', 'M12 2v3', 'M12 19v3', 'M4.2 4.2l2.2 2.2', 'M17.6 17.6l2.2 2.2', 'M2 12h3', 'M19 12h3', 'M4.2 19.8l2.2-2.2', 'M17.6 6.4l2.2-2.2'],
  camera: ['M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'circle:12:13:3.6'],
  calendar: ['rect:3:5:18:16:2', 'M8 3v4', 'M16 3v4', 'M3 10h18'],
  phone: ['M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z'],
  mail: ['rect:3:5:18:14:2', 'm3 7 9 6 9-6'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'm6 6 1 14h10l1-14', 'M10 10v7', 'M14 10v7'],
  plus: ['M12 5v14', 'M5 12h14'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 7 2.5 8.5 2.5 8.5h-17S6 16 6 9', 'M10.3 21a2 2 0 0 0 3.4 0'],
  chevron: ['m6 9 6 6 6-6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  search: ['circle:11:11:8', 'm21 21-4.3-4.3'],
  image: ['rect:3:3:18:18:2', 'circle:9:9:2.2', 'm21 15-5-5L5 21'],
  card: ['rect:2:5:20:14:2', 'M2 10h20', 'M6 15h4'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  star: ['m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1z'],
  building: ['rect:4:2:16:20:2', 'M9 6h2', 'M13 6h2', 'M9 10h2', 'M13 10h2', 'M9 14h2', 'M13 14h2', 'M10 22v-4h4v4'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', 'circle:12:10:2.8'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z', 'circle:12:12:3'],
  clock: ['circle:12:12:9', 'M12 7v5l3 2'],
  briefcase: ['rect:3:7:18:13:2', 'M8 7V5h8v2', 'M3 12h18'],
  filter: ['M4 5h16l-6 8v6l-4-2v-4z'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  'shield-check': ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'm8.5 11.5 2.5 2.5 4.5-5'],
  circle: ['circle:12:12:9'],
  award: ['circle:12:9:6', 'm8.5 14.5-1.5 7 5-3 5 3-1.5-7'],
  'credit-card': ['rect:2:5:20:14:2', 'M2 10h20', 'M6 15h4'],
  key: ['circle:8:15:5', 'm11.5 11.5 8-8', 'm17 5 2 2', 'm14 8 2 2'],
  'bar-chart': ['M5 20V12', 'M12 20V6', 'M19 20v-5'],
  send: ['m22 2-11 11', 'M22 2 15 22l-4-9-9-4z'],
  sparkle: ['m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z'],
  book: ['M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2z', 'M4 19a2 2 0 0 1 2-2h14']
};
