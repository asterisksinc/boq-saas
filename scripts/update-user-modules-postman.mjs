import { readFileSync, writeFileSync } from "node:fs";

const file = "postman/BOQ-Design-Arena-Complete.postman_collection.json";
const collection = JSON.parse(readFileSync(file, "utf8"));
const json = [{ key: "Content-Type", value: "application/json" }];
const request = (name, method, url, raw, variable) => ({
  name,
  request: { method, ...(raw ? { header: json, body: { mode: "raw", raw: JSON.stringify(raw, null, 2) } } : {}), url: `{{baseUrl}}/api/v1${url}` },
  ...(variable ? { event: [{ listen: "test", script: { exec: [`const b = pm.response.json(); if (b.data?.id) pm.collectionVariables.set('${variable}', b.data.id);`] } }] } : {}),
});

const variables = ["boqId","boqRoomId","boqCategoryId","boqItemId","costingCategoryId","costingItemId","vendorQuoteId","scenarioId"];
for (const key of variables) if (!collection.variable.some((item) => item.key === key)) collection.variable.push({ key, value: "" });

const groups = [
  {
    name: "12 — BOQ Management",
    description: "Blank/template-ready BOQ CRUD and the room/category/item editor hierarchy. Run after creating a project in folder 11.",
    item: [
      request("List BOQs", "GET", "/boqs?page=1&pageSize=20"),
      request("Create Blank BOQ", "POST", "/boqs", { boqNumber: "BOQ-0071", projectId: "{{projectId}}", version: "v1", method: "blank", markupPercent: 18, taxPercent: 18 }, "boqId"),
      request("Get BOQ Detail", "GET", "/boqs/{{boqId}}"),
      request("Update BOQ", "PATCH", "/boqs/{{boqId}}", { version: "v1.1", markupPercent: 20 }),
      request("Add Room", "POST", "/boqs/{{boqId}}/rooms", { name: "Master Bedroom", description: "Primary bedroom scope" }, "boqRoomId"),
      request("Add Room Category", "POST", "/boqs/{{boqId}}/rooms/{{boqRoomId}}/categories", { name: "Furniture", description: "Custom furniture" }, "boqCategoryId"),
      request("Add BOQ Item", "POST", "/boqs/{{boqId}}/categories/{{boqCategoryId}}/items", { name: "Full Height Wardrobe", description: "19mm BWP ply, laminate finish", unit: "Sq.ft", quantity: 72, rate: 2875, wastePercent: 5, taxPercent: 18 }, "boqItemId"),
      request("Update BOQ Item", "PATCH", "/boqs/{{boqId}}/items/{{boqItemId}}", { name: "Full Height Wardrobe", unit: "Sq.ft", quantity: 75, rate: 2875, wastePercent: 5, taxPercent: 18 }),
      request("Send BOQ for Review", "POST", "/boqs/{{boqId}}/status", { status: "in_review" }),
      request("Approve BOQ — Owner/Admin", "POST", "/boqs/{{boqId}}/status", { status: "approved" }),
      request("Duplicate BOQ", "POST", "/boqs/{{boqId}}/duplicate"),
      request("Save BOQ as Template", "POST", "/boq-templates", { name: "Residential - 3BHK Standard", boqId: "{{boqId}}", tags: ["Residential", "Popular"] }),
      request("List BOQ Templates", "GET", "/boq-templates?page=1&pageSize=20"),
    ],
  },
  {
    name: "13 — Costing",
    description: "Cost library, category defaults, vendor comparison, scenarios, budget variance, and margin analysis.",
    item: [
      request("List Categories", "GET", "/costing/categories?page=1&pageSize=20"),
      request("Create Category", "POST", "/costing/categories", { name: "Boards", code: "MAT-BRD", defaultUnit: "Sheet", defaultTaxPercent: 18, defaultMarkupPercent: 22, defaultWastePercent: 5, transportIncluded: false, labourIncluded: true, description: "Board and panel products" }, "costingCategoryId"),
      request("Get Category Detail", "GET", "/costing/categories/{{costingCategoryId}}"),
      request("Update Category Defaults", "PATCH", "/costing/categories/{{costingCategoryId}}", { defaultMarkupPercent: 25 }),
      request("List Costing Items", "GET", "/costing/items?page=1&pageSize=20"),
      request("Create Costing Item", "POST", "/costing/items", { name: "18MM HDHMR Board", code: "MAT-BRD-001", categoryId: "{{costingCategoryId}}", unit: "Sheet", baseCost: 1200, sellingRate: 1650, preferredVendor: "Century Ply", spec: "18mm premium board", rateStatus: "active" }, "costingItemId"),
      request("Get Item & Vendor Quotes", "GET", "/costing/items/{{costingItemId}}"),
      request("Add Vendor Quote", "POST", "/costing/vendor-quotes", { itemId: "{{costingItemId}}", vendorName: "Monarch Furnitures", quote: 1180, leadTimeDays: 21, rating: 4.8 }, "vendorQuoteId"),
      request("Select Vendor", "POST", "/costing/vendor-quotes/{{vendorQuoteId}}/selection", { selected: true }),
      request("Create Scenario", "POST", "/costing/scenarios", { name: "Value Engineering - Kitchen", boqId: "{{boqId}}", type: "value_engineering", description: "Cost reduction opportunities", adjustments: [] }, "scenarioId"),
      request("List Scenarios", "GET", "/costing/scenarios?page=1&pageSize=20"),
      request("Get Scenario", "GET", "/costing/scenarios/{{scenarioId}}"),
      request("Duplicate Scenario", "POST", "/costing/scenarios/{{scenarioId}}/duplicate"),
      request("Cost Analysis", "GET", "/costing/analysis"),
      request("Margin Analysis", "GET", "/costing/margins"),
      request("Costing Settings Health", "GET", "/costing/settings"),
    ],
  },
  {
    name: "14 — Reports & Analytics",
    description: "Owner/admin-only workspace business intelligence. Values are derived by the backend and cannot be submitted by the browser.",
    item: [
      request("Reports — This Year", "GET", "/reports/analytics?period=year"),
      request("Reports — This Quarter", "GET", "/reports/analytics?period=quarter"),
      request("Download Reports PDF", "GET", "/reports/analytics/pdf?period=year"),
      request("Reports Forbidden for Member/Viewer", "GET", "/reports/analytics?period=year"),
    ],
  },
];

collection.item = collection.item.filter((group) => !groups.some((replacement) => replacement.name === group.name));
collection.item.push(...groups);
collection.info.version = "2.0.0";
collection.info.description = "Complete authenticated API for Auth, User, Projects, BOQs, Costing, Reports, Proposals, Documents, and Invoices. Keep Postman's cookie jar enabled.";
writeFileSync(file, `${JSON.stringify(collection, null, 2)}\n`);
