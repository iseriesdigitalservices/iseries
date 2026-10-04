export const SITE = {
  name: "I Series Digital Services",
  short: "iSeries",
  tagline: "Your Documents | Your Rights | Our Priority",
  whatsapp: "923417427464",
  phones: [
    { display: "0341 7427464", intl: "923417427464" },
    { display: "0324 0912349", intl: "923240912349" },
  ],
  email: "iseriesdigitalservices@gmail.com",
};

// Referral: the referrer earns this share of every paid order placed by a person they brought in.
export const REFERRAL_RATE = 0.1;

export type DocKey = "cnicFront" | "cnicBack" | "passportCopy" | "degreeCopy" | "firCopy" | "resultCard";
export type DocReq = { key: DocKey; label: string; required: boolean };

export type Service = {
  slug: string;
  title: string;
  urdu: string;
  desc: string;
  points: string[];
  icon: string;
  price: number | null; // PKR; null = quote based
  docs: DocReq[];
};

const CNIC: DocReq[] = [
  { key: "cnicFront", label: "CNIC — Front", required: true },
  { key: "cnicBack", label: "CNIC — Back", required: true },
];
const PASSPORT_REQ: DocReq = { key: "passportCopy", label: "Passport — Data page", required: true };

export const SERVICES: Service[] = [
  {
    slug: "status-check",
    title: "Passport / ECL / PCL / Block Check",
    urdu: "پاسپورٹ، ای سی ایل، پی سی ایل، بلاک چیک",
    desc: "Not sure what is wrong? We check your Passport, ECL, PCL and Block status — whatever the issue is, you will know exactly what it is.",
    points: ["Passport status check", "ECL & PCL name check", "CNIC / passport block check", "Exact issue identification"],
    icon: "SearchCheck",
    price: 5000,
    docs: [...CNIC, { key: "passportCopy", label: "Passport — Data page (if you have one)", required: false }],
  },
  {
    slug: "passport",
    title: "Passport Services",
    urdu: "پاسپورٹ سروسز",
    desc: "New apply, renewal, block / unblock — complete guidance from start to finish.",
    points: ["New passport apply", "Renewal & re-issue", "Block / unblock issues", "Document checking"],
    icon: "BookUser",
    price: 25000,
    docs: [...CNIC, { key: "passportCopy", label: "Old Passport — Data page (renewal / block case)", required: false }],
  },
  {
    slug: "passport-verification",
    title: "Passport Verification Clearance",
    urdu: "پاسپورٹ ویریفکیشن کلیئرنس",
    desc: "Passport verification stuck? We help clear the stuck / pending verification so your passport moves forward.",
    points: ["Stuck verification status check", "Cause identification", "Clearance follow-up with departments", "Regular status updates"],
    icon: "FileSearch",
    price: 35000,
    docs: [...CNIC, PASSPORT_REQ],
  },
  {
    slug: "cnic",
    title: "CNIC Block / Unblock",
    urdu: "شناختی کارڈ بلاک / اَن بلاک",
    desc: "Blocked CNIC restoration, biometric and verification issues solved with expert help.",
    points: ["Blocked CNIC restoration", "Slip / charges / biometric issues", "NADRA guidance", "Experienced team support"],
    icon: "IdCard",
    price: 42000,
    docs: [...CNIC],
  },
  {
    slug: "ecl",
    title: "ECL (Exit Control List) Add / Remove",
    urdu: "ایگزٹ کنٹرول لسٹ",
    desc: "Exit Control List status check and legal procedure to get your name removed.",
    points: ["Name verification in ECL", "Legal removal procedure", "Complete documentation", "Follow-up with departments"],
    icon: "PlaneTakeoff",
    price: 42000,
    docs: [...CNIC, PASSPORT_REQ],
  },
  {
    slug: "pcl",
    title: "PCL (Passport Control List) Removal",
    urdu: "پاسپورٹ کنٹرول لسٹ سے نام خارج",
    desc: "Name on the Passport Control List? We guide and follow up the complete removal procedure.",
    points: ["PCL status verification", "Removal procedure & application", "Complete documentation", "Follow-up with departments"],
    icon: "ShieldAlert",
    price: 40000,
    docs: [...CNIC, PASSPORT_REQ],
  },
  {
    slug: "fir",
    title: "FIR Removal",
    urdu: "ایف آئی آر کا خاتمہ",
    desc: "Legal guidance and documentation support for FIR-related matters.",
    points: ["Case review", "Legal procedure guidance", "Application drafting", "Follow-up support"],
    icon: "Scale",
    price: 40000,
    docs: [...CNIC, { key: "firCopy", label: "FIR copy / case paper", required: false }],
  },
  {
    slug: "cro",
    title: "CRO (Criminal Record) Delete",
    urdu: "کرمنل ریکارڈ آفس",
    desc: "Help with Criminal Record Office matters and clearance procedures.",
    points: ["Record status check", "Required paperwork", "Procedure guidance", "Clearance follow-up"],
    icon: "ShieldCheck",
    price: 40000,
    docs: [...CNIC],
  },
  {
    slug: "degree",
    title: "Degree & Diploma Services",
    urdu: "ڈگری اور ڈپلومہ سروسز",
    desc: "Attestation, verification and issuance assistance for degrees and diplomas. Price depends on the work.",
    points: ["Degree attestation", "Verification support", "Duplicate / lost degree", "Diploma processing"],
    icon: "GraduationCap",
    price: null,
    docs: [...CNIC, { key: "degreeCopy", label: "Degree / Transcript copy", required: false }],
  },
  {
    slug: "lat-gat",
    title: "LAT & GAT Result Clearing",
    urdu: "LAT اور GAT رزلٹ",
    desc: "Guidance for LAT and GAT result issues and clearance procedures.",
    points: ["Result status check", "Issue resolution guidance", "Application support", "Timely follow-up"],
    icon: "FileCheck2",
    price: 35000,
    docs: [...CNIC, { key: "resultCard", label: "Result card / roll number slip", required: false }],
  },
  {
    slug: "nadra-frc",
    title: "NADRA Services & FRC",
    urdu: "نادرا سروسز اور فیملی رجسٹریشن",
    desc: "NADRA records, Family Registration Certificate (FRC) and related documents.",
    points: ["Family Registration Certificate", "Record correction", "Overseas NADRA help", "B-Form / CRC guidance"],
    icon: "Users",
    price: 12000,
    docs: [...CNIC],
  },
];

/** Documents the customer must / may upload for a set of services (passport only where relevant). */
export function docsFor(slugs: string[]): DocReq[] {
  const map = new Map<DocKey, DocReq>();
  for (const slug of slugs) {
    const svc = SERVICES.find((s) => s.slug === slug);
    if (!svc) continue;
    for (const d of svc.docs) {
      const ex = map.get(d.key);
      if (!ex) map.set(d.key, { ...d });
      else if (d.required && !ex.required) map.set(d.key, { ...d });
    }
  }
  return [...map.values()];
}

export const FAQS = [
  {
    q: "Can I use your services while living outside Pakistan?",
    a: "Yes, absolutely. Our team helps overseas Pakistanis all over the world. You can reach us on WhatsApp or through the online form and order from anywhere.",
  },
  {
    q: "How long does the work take?",
    a: "It depends on the service and the department involved. We give you an estimate at the start and keep you updated during the whole process.",
  },
  {
    q: "Is my information safe?",
    a: "Yes. Your documents and personal information are kept 100% confidential and are never shared with a third party.",
  },
  {
    q: "Do you guarantee the result?",
    a: "The final decision belongs to the government departments, so we cannot guarantee a result. We take responsibility for correct guidance, complete documents and consistent follow-up.",
  },
  {
    q: "Which documents do I need for an order?",
    a: "It depends on the service. Everyone needs a CNIC (front and back). A passport copy is only requested for services where it is required (such as ECL, PCL and Passport Verification).",
  },
  {
    q: "I do not know what is wrong with my passport / ECL / PCL or CNIC. What should I do?",
    a: "No problem. Our 'Passport / ECL / PCL / Block Check' service (Rs 5,000) tells you exactly what the problem is, and then we guide you to the right solution.",
  },
  {
    q: "How does Refer & Earn work?",
    a: "Create an account and give your referral link to someone new. When they register with it and place an order, you get 10% of that order as soon as the payment is approved. It shows in your profile and the admin deposits it to you. The more new people you bring, the more you earn.",
  },
  {
    q: "I forgot my password. How can I reset it?",
    a: "On the login page click 'Forgot password?', enter your email and we will send you a 6-digit code. Enter the code and choose a new password.",
  },
  {
    q: "How do I know the fee?",
    a: "Every service shows its fee on the services page. For services priced 'on work basis' our team looks at your case and tells you a clear, transparent fee — no hidden charges.",
  },
];

// Prices in PKR. `null` = price depends on the work (quote based).
export const PRICES: Record<string, number | null> = Object.fromEntries(SERVICES.map((s) => [s.slug, s.price]));

export function formatPKR(n: number) {
  return "Rs " + n.toLocaleString("en-PK");
}

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

export const ORDER_STATUS: Record<string, { label: string; short: string; cls: string }> = {
  pending_review: { label: "Payment under review", short: "Under review", cls: "bg-amber-100 text-amber-800" },
  processing: { label: "In process — our team is working on your case", short: "In process", cls: "bg-blue-100 text-blue-800" },
  approved: { label: "In process — our team is working on your case", short: "In process", cls: "bg-blue-100 text-blue-800" },
  completed: { label: "Process done — service delivered", short: "Completed", cls: "bg-green-100 text-green-800" },
  rejected: { label: "Payment rejected", short: "Rejected", cls: "bg-red-100 text-red-800" },
};
