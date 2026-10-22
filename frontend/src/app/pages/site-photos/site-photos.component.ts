import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { SiteVisit } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { FDatePipe } from '../../shared/pipes';

@Component({
  selector: 'app-site-photos',
  standalone: true,
  imports: [FormsModule, IconComponent, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">View All Site Photos</div>
          <div class="small muted" style="margin-top:3px">All client visit photos &amp; verification proof from every member</div>
        </div>
        <div class="toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8" />
            <input placeholder="Search client / plot…" [(ngModel)]="search" (ngModelChange)="load(1)" />
          </div>
          <span class="badge blue">{{ totalPhotos() }} photos</span>
        </div>
      </div>

      <div class="card-b">
        @for (v of visits(); track v.id) {
          @if (v.photos.length) {
            <div style="margin-bottom:22px">
              <div class="flex-between" style="margin-bottom:10px">
                <div class="flex">
                  <div class="box bg-green" style="width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center">
                    <app-icon name="camera" [size]="18" />
                  </div>
                  <div>
                    <div style="font-weight:800">{{ v.clientName }}</div>
                    <div class="small muted">{{ v.visitDate | fdate }} • Plot {{ v.plotNo || '—' }} • By {{ v.createdByName }}</div>
                  </div>
                </div>
                <span class="badge gray">{{ v.photos.length }} photos</span>
              </div>
              <div class="photo-grid">
                @for (p of v.photos; track p.id) {
                  <div class="photo-item">
                    <img [src]="p.filePath" [alt]="p.caption || ''" (click)="preview = p.filePath" />
                    <div class="cap">{{ p.caption || 'Site photo' }} • {{ p.uploadedAt | fdate }}</div>
                  </div>
                }
              </div>
            </div>
          }
        } @empty {
          <div class="empty"><app-icon name="image" [size]="28" color="#cbd5e1" /> No site photos yet</div>
        }
      </div>
    </div>

    @if (preview) {
      <div class="modal-back" (click)="preview = null" style="background:rgba(0,0,0,.8)">
        <img [src]="preview" style="max-width:90vw;max-height:86vh;border-radius:14px" />
      </div>
    }
  `
})
export class SitePhotosComponent {
  private api = inject(ApiService);
  search = '';
  visits = signal<SiteVisit[]>([]);
  preview: string | null = null;

  totalPhotos = computed(() => this.visits().reduce((s, v) => s + v.photos.length, 0));

  constructor() {
    this.load(1);
  }

  load(page: number) {
    const opts: { search?: string; page: number; pageSize: number } = { page, pageSize: 50 };
    if (this.search) opts.search = this.search;
    this.api.getSiteVisits(opts).subscribe(res => this.visits.set(res.items));
  }
}
