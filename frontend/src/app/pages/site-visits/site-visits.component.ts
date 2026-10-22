import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { SiteVisit, Person, Plot } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-site-visits',
  standalone: true,
  imports: [FormsModule, IconComponent, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">Site Visits</div>
          <div class="small muted" style="margin-top:3px">
            {{ auth.isAdmin() ? 'All members\' client site visits' : 'Your client site visits — add visits & send photos' }}
          </div>
        </div>
        <div class="toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8" />
            <input placeholder="Search client / plot…" [(ngModel)]="search" (ngModelChange)="load(1)" />
          </div>
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="status" (ngModelChange)="load(1)">
            <option value="">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button class="btn btn-primary" (click)="openCreate()">
            <app-icon name="plus" [size]="15" color="#fff" /> New Site Visit
          </button>
        </div>
      </div>

      <div class="card-b">
        @for (v of visits(); track v.id) {
          <div style="border:1px solid var(--line); border-radius:13px; padding:16px; margin-bottom:13px">
            <div class="flex-between" style="flex-wrap:wrap">
              <div class="flex">
                <div class="box bg-blue" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center">
                  <app-icon name="pin" [size]="20" />
                </div>
                <div>
                  <div style="font-weight:800">{{ v.clientName }}
                    <span class="badge" style="margin-left:6px"
                          [class.green]="v.status === 'Completed'" [class.orange]="v.status === 'Scheduled'" [class.gray]="v.status === 'Cancelled'">
                      {{ v.status }}
                    </span>
                  </div>
                  <div class="small muted">
                    {{ v.clientPhone }} • Visit: {{ v.visitDate | fdate }}
                    @if (v.plotNo) { • Plot {{ v.plotNo }} }
                    • By {{ v.createdByName }}
                  </div>
                </div>
              </div>
              <div class="flex">
                <button class="btn btn-soft-blue btn-sm" (click)="openUpload(v)">
                  <app-icon name="camera" [size]="13" /> Send Photos
                </button>
                @if (auth.isAdmin()) {
                  <button class="btn btn-ghost btn-sm" (click)="openEdit(v)"><app-icon name="edit" [size]="13" /></button>
                  <button class="btn btn-danger btn-sm" (click)="remove(v)"><app-icon name="trash" [size]="13" /></button>
                }
              </div>
            </div>

            @if (v.notes) {
              <div class="small muted" style="margin-top:9px; background:#f8fafc; padding:8px 12px; border-radius:9px">
                📝 {{ v.notes }}
              </div>
            }

            @if (v.photos.length) {
              <div class="photo-grid" style="margin-top:12px">
                @for (p of v.photos; track p.id) {
                  <div class="photo-item">
                    <img [src]="p.filePath" [alt]="p.caption || 'visit photo'" (click)="preview = p.filePath" />
                    <div class="cap">
                      {{ p.caption || 'Photo' }}
                      @if (auth.isAdmin()) {
                        <a style="color:var(--red);cursor:pointer;float:right" (click)="removePhoto(v, p.id)">✕</a>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="small muted" style="margin-top:10px">No photos yet — click <b>Send Photos</b> to upload visit proof.</div>
            }
          </div>
        } @empty {
          <div class="empty"><app-icon name="camera" [size]="28" color="#cbd5e1" /> No site visits found</div>
        }

        <div class="pagination">
          <div class="info">Showing {{ visits().length }} of {{ total() }} visits</div>
          <button class="page-btn" [disabled]="page() <= 1" (click)="load(page() - 1)">Prev</button>
          <span class="small muted">Page {{ page() }}</span>
          <button class="page-btn" [disabled]="visits().length < pageSize" (click)="load(page() + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- CREATE / EDIT MODAL -->
    @if (showForm()) {
      <div class="modal-back" (click)="showForm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">{{ editId() ? 'Edit Site Visit' : 'New Site Visit' }}</div>
            <button class="icon-btn" style="border:0" (click)="showForm.set(false)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field">
                <label>Client (3rd Person) *</label>
                <select [(ngModel)]="form.personId">
                  <option [ngValue]="0">— Select client —</option>
                  @for (p of persons(); track p.id) {
                    <option [ngValue]="p.id">{{ p.fullName }} — {{ p.phone }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Plot</label>
                <select [(ngModel)]="form.plotId">
                  <option [ngValue]="null">— Optional —</option>
                  @for (p of plots(); track p.id) {
                    <option [ngValue]="p.id">{{ p.plotNo }} — {{ p.project }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Visit Date *</label>
                <input type="date" [(ngModel)]="form.visitDate" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="form.status">
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div class="field full">
                <label>Notes</label>
                <textarea [(ngModel)]="form.notes" placeholder="Client feedback, next steps…"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveVisit()">
              <app-icon name="check" [size]="14" color="#fff" /> {{ editId() ? 'Save Changes' : 'Create Visit' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- PHOTO UPLOAD MODAL -->
    @if (uploadTarget()) {
      <div class="modal-back" (click)="uploadTarget.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">Send Site Visit Photos</div>
            <button class="icon-btn" style="border:0" (click)="uploadTarget.set(null)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="small muted" style="margin-bottom:12px">
              Visit: <b>{{ uploadTarget()!.clientName }}</b> • {{ uploadTarget()!.visitDate | fdate }}
            </div>
            <div class="field">
              <label>Select photos (JPG / PNG / WEBP, max 10MB each)</label>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" (change)="onFiles($event)" style="padding:12px" />
            </div>
            <div class="field" style="margin-top:12px">
              <label>Caption (optional)</label>
              <input [(ngModel)]="uploadCaption" placeholder="e.g. Main gate view" />
            </div>
            @if (selectedFiles.length) {
              <div class="small" style="margin-top:12px; color:var(--green)">
                <app-icon name="check" [size]="13" color="#16a34a" /> {{ selectedFiles.length }} file(s) selected
              </div>
            }
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="uploadTarget.set(null)">Cancel</button>
            <button class="btn btn-primary" [disabled]="!selectedFiles.length || uploading()" (click)="doUpload()">
              <app-icon name="send" [size]="14" color="#fff" /> {{ uploading() ? 'Uploading…' : 'Upload Photos' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- PHOTO PREVIEW -->
    @if (preview) {
      <div class="modal-back" (click)="preview = null" style="background:rgba(0,0,0,.8)">
        <img [src]="preview" style="max-width:90vw;max-height:86vh;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)" />
      </div>
    }
  `
})
export class SiteVisitsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  search = '';
  status = '';
  pageSize = 8;

  visits = signal<SiteVisit[]>([]);
  total = signal(0);
  page = signal(1);
  persons = signal<Person[]>([]);
  plots = signal<Plot[]>([]);

  showForm = signal(false);
  editId = signal<number | null>(null);
  form = this.blankForm();

  uploadTarget = signal<SiteVisit | null>(null);
  uploadCaption = '';
  selectedFiles: File[] = [];
  uploading = signal(false);

  preview: string | null = null;

  constructor() {
    this.load(1);
    this.api.getPersons({ pageSize: 200 }).subscribe(r => this.persons.set(r.items));
    this.api.getPlots().subscribe(p => this.plots.set(p));
  }

  private blankForm() {
    const today = new Date().toISOString().slice(0, 10);
    return { personId: 0 as number | null, plotId: null as number | null, visitDate: today, notes: '', status: 'Completed' };
  }

  load(page: number) {
    const opts: { search?: string; status?: string; page: number; pageSize: number } = { page, pageSize: this.pageSize };
    if (this.search) opts.search = this.search;
    if (this.status) opts.status = this.status;
    this.api.getSiteVisits(opts).subscribe(res => {
      this.visits.set(res.items);
      this.total.set(res.total);
      this.page.set(page);
    });
  }

  openCreate() {
    this.editId.set(null);
    this.form = this.blankForm();
    this.showForm.set(true);
  }

  openEdit(v: SiteVisit) {
    this.editId.set(v.id);
    this.form = {
      personId: v.personId,
      plotId: v.plotId,
      visitDate: v.visitDate.slice(0, 10),
      notes: v.notes || '',
      status: v.status
    };
    this.showForm.set(true);
  }

  saveVisit() {
    if (!this.form.personId) {
      this.toast.error('Please select a client');
      return;
    }
    const body = {
      personId: this.form.personId!,
      plotId: this.form.plotId,
      visitDate: new Date(this.form.visitDate).toISOString(),
      notes: this.form.notes,
      status: this.form.status
    };
    const req = this.editId()
      ? this.api.updateSiteVisit(this.editId()!, body)
      : this.api.createSiteVisit(body);

    req.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Site visit updated' : 'Site visit created — now send photos!');
        this.showForm.set(false);
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Save failed')
    });
  }

  openUpload(v: SiteVisit) {
    this.uploadTarget.set(v);
    this.selectedFiles = [];
    this.uploadCaption = '';
  }

  onFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  doUpload() {
    const target = this.uploadTarget();
    if (!target || !this.selectedFiles.length) return;
    this.uploading.set(true);

    this.api.uploadVisitPhotos(target.id, this.selectedFiles, this.uploadCaption).subscribe({
      next: updated => {
        this.uploading.set(false);
        this.toast.success(`${this.selectedFiles.length} photo(s) uploaded successfully`);
        this.uploadTarget.set(null);
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.toast.error(err.error?.message || 'Upload failed');
      }
    });
  }

  removePhoto(v: SiteVisit, photoId: number) {
    if (!confirm('Delete this photo?')) return;
    this.api.deleteVisitPhoto(v.id, photoId).subscribe({
      next: () => {
        this.toast.success('Photo deleted');
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }

  remove(v: SiteVisit) {
    if (!confirm(`Delete site visit of ${v.clientName}?`)) return;
    this.api.deleteSiteVisit(v.id).subscribe({
      next: () => {
        this.toast.success('Site visit deleted');
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }
}
