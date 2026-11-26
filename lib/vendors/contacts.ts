/**
 * Vendor contact details — fictional sample data.
 *
 * PRD §09: contact data must never appear in search results, profile payloads or client state before an OTP check.
 * Only `verifyContactOtp` in ./store.ts reads this module. When the backend exists this file moves server-side behind
 * a protected endpoint (POST /api/v1/vendors/:id/contact-disclosures/verify) and is deleted from the client bundle.
 */
export interface VendorContact {
    phone: string;
    email: string;
    address: string;
}

const CONTACTS: Record<string, VendorContact> = {
    "studio-surface": { phone: "+91 98765 43210", email: "sales@studiosurface.in", address: "Road No. 12, Banjara Hills, Hyderabad 500034" },
    "charminar-tiles": { phone: "+91 98575 14820", email: "sales@charminartiles.in", address: "Abids, Hyderabad 500001" },
    "deccan-timber": { phone: "+91 90004 22118", email: "orders@deccantimber.in", address: "KPHB Phase 3, Kukatpally, Hyderabad 500072" },
    "lumina-lighting": { phone: "+91 96661 30245", email: "studio@luminalighting.in", address: "Road No. 36, Jubilee Hills, Hyderabad 500033" },
    "hitech-modular": { phone: "+91 98480 77231", email: "projects@hitechmodular.in", address: "Ayyappa Society, Madhapur, Hyderabad 500081" },
    "secunderabad-sanitary": { phone: "+91 94400 51893", email: "trade@ssh.in", address: "SD Road, Secunderabad 500003" },
    "weave-fabrics": { phone: "+91 97010 66420", email: "hello@weavedrape.in", address: "Ameerpet X Roads, Hyderabad 500016" },
    "unlisted-wallcraft": { phone: "+91 91234 70045", email: "info@wallcraft.in", address: "Begumpet, Hyderabad 500016" },
    "marblecraft-blr": { phone: "+91 98450 31277", email: "sales@marblecraft.in", address: "Peenya Industrial Area, Bengaluru 560058" },
    "indiranagar-lighting": { phone: "+91 99001 45672", email: "design@indiranagarlighting.in", address: "100 Feet Road, Indiranagar, Bengaluru 560038" },
    "whitefield-woodworks": { phone: "+91 97411 20983", email: "workshop@whitefieldwood.in", address: "ITPL Main Road, Whitefield, Bengaluru 560066" },
    "pune-plyhouse": { phone: "+91 98220 64410", email: "orders@puneply.in", address: "NIBM Road, Kondhwa, Pune 411048" },
    "adyar-bath": { phone: "+91 98410 88213", email: "experience@adyarbath.in", address: "LB Road, Adyar, Chennai 600020" },
    "andheri-glass": { phone: "+91 98203 55102", email: "quotes@andheriglass.in", address: "MIDC, Andheri East, Mumbai 400069" },
};

export function lookupVendorContact(vendorId: string): VendorContact | null {
    return CONTACTS[vendorId] ?? null;
}
