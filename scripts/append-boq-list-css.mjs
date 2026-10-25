import fs from 'fs';

const css = `
/* ==========================================================================
   BOQ TEMPLATES - LIST VIEW & FILTER PANEL (Figma Redesign)
   Frames: Frame 2147225069, Frame 57, Frame 59, Frame 2147225166, Frame 2147225086
   ========================================================================== */

/* Main layout row containing Table + Filter Drawer */
.boq-list-layout-wrap {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

/* Outer Table Container: Frame 2147225069 */
.boq-table-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 32px;
  width: 100%;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
}

/* Inner Table Wrapper */
.boq-table-scroll-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.boq-table-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  width: 100%;
  min-width: 950px;
}

/* Table element */
.boq-list-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Urbanist', Inter, -apple-system, sans-serif;
}

/* Header Row: Frame 57 */
.boq-list-table thead tr {
  height: 36px;
  border-radius: 8px;
}

.boq-list-table thead th {
  background: #E4ECFB;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  text-transform: uppercase;
  color: #64748B;
  padding: 8px 12px;
  text-align: left;
  border: none;
  white-space: nowrap;
}

.boq-list-table thead th:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.boq-list-table thead th:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Column specific widths */
.boq-col-name { width: 284px; min-width: 260px; }
.boq-col-category { width: 143px; min-width: 120px; }
.boq-col-sections { width: 99px; min-width: 80px; }
.boq-col-items { width: 99px; min-width: 80px; }
.boq-col-mapping { width: 231px; min-width: 190px; }
.boq-col-used { width: 100px; min-width: 80px; }
.boq-col-version { width: 84px; min-width: 70px; }
.boq-col-status { width: 76px; min-width: 70px; }
.boq-col-modified { width: 115px; min-width: 105px; }
.boq-col-actions { width: 64px; min-width: 50px; text-align: center; }

/* Table Body Rows: Frame 59, 67, 68, etc. */
.boq-list-table tbody tr {
  height: 78px;
  transition: background 0.15s ease;
  cursor: pointer;
}

.boq-list-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.7);
}

.boq-list-table td {
  padding: 6px 12px;
  vertical-align: middle;
  border-bottom: 1px solid #EBEBEB;
}

/* 1. Name Cell */
.boq-cell-name-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 8px 6px 0px;
  gap: 16px;
  min-height: 56px;
}

.boq-cell-thumb {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
  background: #D9D9D9;
}

.boq-cell-name-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.boq-cell-title {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 120%;
  color: #0F172A;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.boq-cell-code {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
}

.boq-cell-subtags {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  height: 18px;
}

.boq-cell-subtag-pill {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2px 6px;
  gap: 10px;
  height: 18px;
  background: rgba(71, 85, 105, 0.1);
  border-radius: 9999px;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 120%;
  color: #475569;
}

/* 2. Category Cell */
.boq-cell-category-wrap {
  display: flex;
  align-items: center;
}

.boq-category-pill {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2px 6px;
  height: 18px;
  border-radius: 9999px;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 120%;
  text-transform: uppercase;
}

.boq-category-pill.cat-interior,
.boq-category-pill.cat-kitchen,
.boq-category-pill.cat-electrical,
.boq-category-pill.cat-plumbing {
  background: rgba(37, 99, 235, 0.12);
  color: #0085FF;
}

.boq-category-pill.cat-flooring {
  background: rgba(250, 176, 0, 0.1);
  color: #FAB000;
}

.boq-category-pill.cat-painting {
  background: rgba(220, 38, 38, 0.1);
  color: #DC2626;
}

.boq-category-pill.cat-commercial {
  background: rgba(83, 58, 253, 0.1);
  color: #533AFD;
}

.boq-category-pill.cat-default {
  background: rgba(37, 99, 235, 0.12);
  color: #2563EB;
}

/* 3. Sections & 4. Items Cells */
.boq-cell-count-text {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
}

/* 5. Cost Mapping Cell */
.boq-cell-mapping-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 194px;
  height: 17px;
}

.boq-cell-mapping-track {
  width: 158px;
  height: 8px;
  background: #E2E8F0;
  border-radius: 100px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.boq-cell-mapping-fill {
  height: 8px;
  border-radius: 118px;
  transition: width 0.3s ease;
}

.boq-cell-mapping-fill.high {
  background: #16A34A;
}

.boq-cell-mapping-fill.medium {
  background: #FAB000;
}

.boq-cell-mapping-fill.low {
  background: #DC2626;
}

.boq-cell-mapping-pct {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
  min-width: 28px;
}

/* 6. Used In Cell */
.boq-cell-used-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;
}

.boq-cell-used-num {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 120%;
  color: #0F172A;
}

.boq-cell-used-label {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
}

/* 7. Version Cell */
.boq-cell-version-text {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
}

/* 8. Status Cell */
.boq-cell-status-pill {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2px 6px;
  height: 18px;
  border-radius: 9999px;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 120%;
  text-transform: uppercase;
}

.boq-cell-status-pill.status-active {
  background: rgba(22, 163, 74, 0.12);
  color: #16A34A;
}

.boq-cell-status-pill.status-draft {
  background: rgba(100, 116, 139, 0.12);
  color: #64748B;
}

.boq-cell-status-pill.status-archived {
  background: rgba(220, 38, 38, 0.12);
  color: #DC2626;
}

/* 9. Last Modified Cell */
.boq-cell-modified-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;
}

.boq-cell-modified-date {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
  white-space: nowrap;
}

.boq-cell-modified-time {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 120%;
  color: #94A3B8;
  white-space: nowrap;
}

/* 10. Actions Cell */
.boq-cell-action-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.boq-row-menu-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #64748B;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.boq-row-menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #0F172A;
}

/* Pagination Bar: Frame 2147225166 */
.boq-pagination-bar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0px;
  gap: 8px;
  width: 100%;
  height: 50px;
  box-sizing: border-box;
}

.boq-pagination-total {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  color: #0F172A;
  white-space: nowrap;
}

.boq-pagination-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 34px;
}

.boq-page-num-btn {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid #EBEBEB;
  border-radius: 6px;
  background: transparent;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}

.boq-page-num-btn:hover:not(:disabled) {
  border-color: #CBD5E1;
  color: #0F172A;
}

.boq-page-num-btn.active {
  background: #E4ECFB;
  border: 1px solid #2563EB;
  color: #2563EB;
}

.boq-page-num-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.boq-pagination-size {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  height: 34px;
}

.boq-pagination-size-label {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  color: #0F172A;
  white-space: nowrap;
}

.boq-pagination-size-box {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 10px;
  width: 83px;
  height: 34px;
  border: 1px solid #EBEBEB;
  border-radius: 6px;
  background: #FFFFFF;
  position: relative;
}

.boq-pagination-size-select {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  color: #64748B;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

/* Filter Side Panel: Frame 2147225086 */
.boq-filter-sidebar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 24px;
  width: 310px;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
}

.boq-filter-sidebar-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 12px;
}

.boq-filter-sidebar-title {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0F172A;
  margin: 0;
}

.boq-filter-sidebar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}

.boq-filter-sidebar-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #0F172A;
}

.boq-filter-sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.boq-filter-sidebar-label {
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 120%;
  color: #0F172A;
}

.boq-filter-sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.boq-filter-sidebar-cb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Urbanist', Inter, sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.boq-filter-sidebar-cb input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #2563EB;
  cursor: pointer;
}

.boq-filter-sidebar-select {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  font-family: 'Urbanist', Inter, sans-serif;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  outline: none;
}

.boq-filter-sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  border-top: 1px solid #F1F5F9;
  padding-top: 16px;
}

.boq-filter-sidebar-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.boq-filter-sidebar-btn-clear {
  flex: 1;
  height: 40px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  border-radius: 6px;
  font-family: 'Urbanist', Inter, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.boq-filter-sidebar-btn-clear:hover {
  border-color: #CBD5E1;
  color: #0F172A;
}

.boq-filter-sidebar-btn-apply {
  flex: 1;
  height: 40px;
  background: #2563EB;
  border: none;
  border-radius: 6px;
  font-family: 'Urbanist', Inter, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #FFFFFF;
  cursor: pointer;
  transition: background 0.15s ease;
}

.boq-filter-sidebar-btn-apply:hover {
  background: #1D4ED8;
}

.boq-filter-sidebar-summary {
  font-family: 'Urbanist', Inter, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  text-align: center;
}

/* Row Skeletons */
.boq-table-row-skeleton {
  height: 78px;
  border-bottom: 1px solid #EBEBEB;
}

.boq-skeleton-pill {
  height: 18px;
  width: 60px;
  border-radius: 9999px;
  background: #E2E8F0;
}
`;

fs.appendFileSync('E:/boq-saas-chandu/boq-saas/app/templates-overview.css', css, 'utf8');
console.log('Appended BOQ list CSS successfully');
