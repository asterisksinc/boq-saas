import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { boqSubcategorySchema, boqItemSchema } from "../lib/api/validation";
import { formatFullIndianCurrency } from "../lib/domain/boq-data";
import type { BoqSubcategory, BoqCategory, BoqItem } from "../lib/types";

describe("BOQ Room Category & Subcategory Redesign (Master Bedroom Figma Fidelity)", () => {
    const roomViewPath = join(process.cwd(), "components", "boqs", "BoqRoomCategoryView.tsx");
    const cssPath = join(process.cwd(), "app", "boq-redesign.css");
    const routePath = join(process.cwd(), "app", "api", "v1", "[...path]", "route.ts");
    const clientApiPath = join(process.cwd(), "lib", "api", "boqs.ts");
    const typesPath = join(process.cwd(), "lib", "types.ts");

    it("verifies all required files and modules exist", () => {
        expect(existsSync(roomViewPath)).toBe(true);
        expect(existsSync(cssPath)).toBe(true);
        expect(existsSync(routePath)).toBe(true);
        expect(existsSync(clientApiPath)).toBe(true);
        expect(existsSync(typesPath)).toBe(true);
    });

    describe("CSS Architecture & Figma Class Names", () => {
        const cssContent = readFileSync(cssPath, "utf-8");
        const roomViewContent = readFileSync(roomViewPath, "utf-8");

        it("defines all major Figma layout container classes in CSS", () => {
            expect(cssContent).toContain(".boq-room-detail-shell");
            expect(cssContent).toContain(".boq-room-gradient-ambient");
            expect(cssContent).toContain(".boq-room-breadcrumb-redesign");
            expect(cssContent).toContain(".boq-room-two-column-layout");
            expect(cssContent).toContain(".boq-room-category-panel");
            expect(cssContent).toContain(".boq-btn-add-more-category");
            expect(cssContent).toContain(".boq-room-category-item-row");
            expect(cssContent).toContain(".boq-room-main-panel");
            expect(cssContent).toContain(".boq-subcategory-card");
            expect(cssContent).toContain(".boq-subcategory-header-bar");
            expect(cssContent).toContain(".boq-btn-add-item-subcategory");
            expect(cssContent).toContain(".boq-items-table");
            expect(cssContent).toContain(".boq-room-pagination-bar");
        });

        it("uses correct Figma color specifications and dimensions", () => {
            // Category panel 310px width and translucent white card background
            expect(cssContent).toContain("width: 310px;");
            expect(cssContent).toContain("background: rgba(255, 255, 255, 0.6);");
            // Primary Blue button #2563EB
            expect(cssContent).toContain("background: #2563EB;");
            // Table header background #E4ECFB
            expect(cssContent).toContain("background: #E4ECFB;");
            // Amount green #16A34A
            expect(cssContent).toContain("#16A34A");
            // Border divider #EBEBEB
            expect(cssContent).toContain("#EBEBEB");
        });

        it("applies Figma classes inside BoqRoomCategoryView component", () => {
            expect(roomViewContent).toContain("boq-room-detail-shell");
            expect(roomViewContent).toContain("boq-room-gradient-ambient");
            expect(roomViewContent).toContain("boq-room-breadcrumb-redesign");
            expect(roomViewContent).toContain("boq-room-two-column-layout");
            expect(roomViewContent).toContain("boq-room-category-panel");
            expect(roomViewContent).toContain("boq-btn-add-more-category");
            expect(roomViewContent).toContain("boq-room-main-panel");
            expect(roomViewContent).toContain("boq-subcategory-card");
            expect(roomViewContent).toContain("boq-items-table");
            expect(roomViewContent).toContain("boq-room-pagination-bar");
        });
    });

    describe("Breadcrumb & Room Identity Header", () => {
        const roomViewContent = readFileSync(roomViewPath, "utf-8");

        it("renders the 3-tier breadcrumb matching Figma Frame 240: Bill of Quantities → BOQ ID → Room Name", () => {
            expect(roomViewContent).toContain("Bill of Quantities");
            expect(roomViewContent).toContain("boq-room-breadcrumb-link");
            expect(roomViewContent).toContain("boq-room-breadcrumb-active");
            expect(roomViewContent).toContain("{activeBoq.boqNumber}");
            expect(roomViewContent).toContain("{room.name}");
        });

        it("provides back navigation links to return to BOQ details or listing", () => {
            expect(roomViewContent).toContain("onClick={onBackToList}");
            expect(roomViewContent).toContain("onClick={onBackToBoq}");
        });
    });

    describe("Left Category Navigation Panel (310px)", () => {
        const roomViewContent = readFileSync(roomViewPath, "utf-8");

        it("renders the room title header and Add More Category button", () => {
            expect(roomViewContent).toContain("boq-room-category-panel-title");
            expect(roomViewContent).toContain("Add More Category");
            expect(roomViewContent).toContain("boq-btn-add-more-category");
        });

        it("displays category list with count badge and active indicator", () => {
            expect(roomViewContent).toContain("boq-room-category-item-row");
            expect(roomViewContent).toContain("boq-room-category-item-badge");
        });

        it("handles category selection and keyboard navigation", () => {
            expect(roomViewContent).toContain("setSelectedCategoryId(cat.id)");
            expect(roomViewContent).toContain("role=\"button\"");
        });
    });

    describe("Right Main Panel: Subcategory Hierarchy & Contextual Items", () => {
        const roomViewContent = readFileSync(roomViewPath, "utf-8");

        it("renders subcategory cards with toggle chevron and subcategory title", () => {
            expect(roomViewContent).toContain("boq-subcategory-card");
            expect(roomViewContent).toContain("boq-subcategory-header-bar");
            expect(roomViewContent).toContain("boq-subcategory-title-text");
            expect(roomViewContent).toContain("toggleSubcatCollapse");
        });

        it("provides contextual '+ Add Item' button specifically within each subcategory", () => {
            expect(roomViewContent).toContain("boq-btn-add-item-subcategory");
            expect(roomViewContent).toContain("Add Item");
            expect(roomViewContent).toContain("openAddItemModal(subcat)");
        });

        it("allows adding a new subcategory with '+ Add Subcategory' action", () => {
            expect(roomViewContent).toContain("boq-btn-add-subcategory-primary");
            expect(roomViewContent).toContain("Add Subcategory");
            expect(roomViewContent).toContain("setShowAddSubcategoryModal(true)");
        });

        it("renders the 10-column items table with exact Figma headers", () => {
            expect(roomViewContent).toContain("ITEM");
            expect(roomViewContent).toContain("UNIT");
            expect(roomViewContent).toContain("QTY");
            expect(roomViewContent).toContain("RATE (₹)");
            expect(roomViewContent).toContain("WASTE (%)");
            expect(roomViewContent).toContain("TAX (%)");
            expect(roomViewContent).toContain("AMOUNT (₹)");
        });

        it("displays the subtotal per subcategory and total category summary bar", () => {
            expect(roomViewContent).toContain("boq-subcategory-subtotal-val");
            expect(roomViewContent).toContain("TOTAL (");
            expect(roomViewContent).toContain("totalCategoryAmount");
        });

        it("provides pagination controls per subcategory matching Figma Frame 2147225166", () => {
            expect(roomViewContent).toContain("boq-room-pagination-bar");
            expect(roomViewContent).toContain("boq-room-total-items-tag");
            expect(roomViewContent).toContain("boq-room-pagination-controls");
            expect(roomViewContent).toContain("boq-room-page-btn");
            expect(roomViewContent).toContain("Show per Page:");
        });
    });

    describe("Data Validation Schemas & Types", () => {
        it("validates subcategory creation via boqSubcategorySchema", () => {
            const validPayload = {
                name: "Wardrobe & Storage",
                description: "Built-in modular wardrobe with sliding glass doors",
                sortOrder: 1,
            };
            const parsed = boqSubcategorySchema.parse(validPayload);
            expect(parsed.name).toBe("Wardrobe & Storage");
            expect(parsed.description).toBe("Built-in modular wardrobe with sliding glass doors");
            expect(parsed.sortOrder).toBe(1);

            // Rejects empty name
            expect(() => boqSubcategorySchema.parse({ name: "" })).toThrow();
        });

        it("allows boqItemSchema to receive subcategoryId and subcategoryName while maintaining strict validation", () => {
            const validItem = {
                name: "Master Bed Frame King Size",
                description: "Teakwood finish with upholstered headboard",
                unit: "nos",
                quantity: 1,
                rate: 65000,
                wastePercent: 0,
                taxPercent: 18,
                sortOrder: 0,
                subcategoryId: "subcat-uuid-1234",
                subcategoryName: "Bed & Headboard",
            };
            const parsed = boqItemSchema.parse(validItem);
            expect(parsed.subcategoryId).toBe("subcat-uuid-1234");
            expect(parsed.subcategoryName).toBe("Bed & Headboard");

            // Still strictly rejects invalid fields like 'amount' computed field
            expect(() => boqItemSchema.parse({ ...validItem, amount: 65000 })).toThrow();
        });

        it("confirms BoqSubcategory type compatibility", () => {
            const testItem: BoqItem = {
                id: "item-1",
                room_id: "room-1",
                category_id: "cat-1",
                subcategoryId: "subcat-1",
                subcategoryName: "Bedding",
                name: "King Bed",
                description: null,
                unit: "nos",
                quantity: 1,
                rate: 50000,
                waste_percent: 0,
                tax_percent: 18,
                amount: 50000,
                sort_order: 0,
            };

            const subcat: BoqSubcategory = {
                id: "subcat-1",
                category_id: "cat-1",
                name: "Bedding",
                sort_order: 0,
                items: [testItem],
            };

            const category: BoqCategory = {
                id: "cat-1",
                room_id: "room-1",
                name: "Furniture",
                description: null,
                sort_order: 0,
                subcategories: [subcat],
                items: [testItem],
                unassignedItems: [],
            };

            expect(category.subcategories?.[0].items?.[0].name).toBe("King Bed");
            expect(category.subcategories?.[0].items?.[0].subcategoryId).toBe("subcat-1");
        });
    });

    describe("Backend Persistence & API Endpoint Architecture", () => {
        const routeContent = readFileSync(routePath, "utf-8");
        const clientApiContent = readFileSync(clientApiPath, "utf-8");

        it("defines backend route handlers for subcategories in route.ts", () => {
            expect(routeContent).toContain("createBoqSubcategory");
            expect(routeContent).toContain("updateBoqSubcategory");
            expect(routeContent).toContain("deleteBoqSubcategory");
            expect(routeContent).toContain("parseCategoryMeta");
            expect(routeContent).toContain("serializeCategoryMeta");
            expect(routeContent).toContain("parseItemMeta");
            expect(routeContent).toContain("serializeItemMeta");
        });

        it("routes subcategory POST/PUT/DELETE requests in route dispatcher", () => {
            expect(routeContent).toContain('subcategories');
        });

        it("exports client API helpers in lib/api/boqs.ts", () => {
            expect(clientApiContent).toContain("export async function addBoqSubcategory");
            expect(clientApiContent).toContain("export async function updateBoqSubcategory");
            expect(clientApiContent).toContain("export async function deleteBoqSubcategory");
        });
    });

    describe("Financial Accuracy & Currency Formatting", () => {
        it("formats item and subtotal amounts accurately using formatFullIndianCurrency", () => {
            expect(formatFullIndianCurrency(45000)).toBe("₹45,000");
            expect(formatFullIndianCurrency(125000)).toBe("₹1,25,000");
            expect(formatFullIndianCurrency(1265800)).toBe("₹12,65,800");
        });
    });
});
