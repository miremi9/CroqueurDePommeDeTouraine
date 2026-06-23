import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'star'
  | 'pin'
  | 'edit'
  | 'delete'
  | 'download';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.html',
  styleUrl: './icon.css'
})
export class IconComponent {

  @Input({ required: true })
  name!: IconName;

  @Input()
  size = 20;

  @Input()
  filled = false;
}