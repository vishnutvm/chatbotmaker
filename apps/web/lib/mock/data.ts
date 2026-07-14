export type AssistantStatus = "live" | "draft" | "paused";
export type KnowledgeStatus = "ready" | "processing" | "needs_attention" | "failed";
export type KnowledgeType = "website" | "sitemap" | "file" | "text";

export interface Assistant {
  id: string;
  name: string;
  description: string;
  status: AssistantStatus;
  purpose: string;
  conversations: number;
  messages: number;
  knowledgeSources: number;
  lastUpdated: string;
  resolutionRate: number;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeType;
  status: KnowledgeStatus;
  pages: number;
  updated: string;
  assistantId: string;
}

export interface Conversation {
  id: string;
  visitor: string;
  visitorInitials: string;
  assistantId: string;
  assistantName: string;
  lastMessage: string;
  time: string;
  messageCount: number;
  status: "open" | "resolved" | "escalated";
  channel: "web" | "slack" | "api";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  sources?: { title: string; url: string }[];
}

export const assistants: Assistant[] = [
  {
    id: "acme-support",
    name: "Acme Support",
    description: "Customer support for Acme Cloud customers",
    status: "live",
    purpose: "Customer Support",
    conversations: 1284,
    messages: 8421,
    knowledgeSources: 4,
    lastUpdated: "2 hours ago",
    resolutionRate: 82,
  },
  {
    id: "sales-copilot",
    name: "Sales Copilot",
    description: "Qualifies leads and books demos",
    status: "live",
    purpose: "Sales Assistant",
    conversations: 342,
    messages: 1980,
    knowledgeSources: 2,
    lastUpdated: "yesterday",
    resolutionRate: 71,
  },
  {
    id: "docs-guide",
    name: "Docs Guide",
    description: "Helps developers navigate the API reference",
    status: "draft",
    purpose: "Documentation Assistant",
    conversations: 0,
    messages: 0,
    knowledgeSources: 1,
    lastUpdated: "3 days ago",
    resolutionRate: 0,
  },
  {
    id: "onboarding-helper",
    name: "Onboarding Helper",
    description: "Walks new users through account setup",
    status: "paused",
    purpose: "Product Expert",
    conversations: 87,
    messages: 402,
    knowledgeSources: 3,
    lastUpdated: "1 week ago",
    resolutionRate: 68,
  },
];

export const knowledgeSources: KnowledgeSource[] = [
  { id: "k1", name: "acme.com", type: "website", status: "ready", pages: 47, updated: "2 days ago", assistantId: "acme-support" },
  { id: "k2", name: "Help center sitemap", type: "sitemap", status: "ready", pages: 128, updated: "1 week ago", assistantId: "acme-support" },
  { id: "k3", name: "Product handbook.pdf", type: "file", status: "ready", pages: 24, updated: "3 days ago", assistantId: "acme-support" },
  { id: "k4", name: "Return policy", type: "text", status: "processing", pages: 1, updated: "just now", assistantId: "acme-support" },
  { id: "k5", name: "sales-deck.pdf", type: "file", status: "ready", pages: 12, updated: "5 days ago", assistantId: "sales-copilot" },
  { id: "k6", name: "pricing.acme.com", type: "website", status: "needs_attention", pages: 8, updated: "14 days ago", assistantId: "sales-copilot" },
];

export const conversations: Conversation[] = [
  { id: "c1", visitor: "Priya Sharma", visitorInitials: "PS", assistantId: "acme-support", assistantName: "Acme Support", lastMessage: "Thanks, that solved it!", time: "2m", messageCount: 6, status: "resolved", channel: "web" },
  { id: "c2", visitor: "Marcus Lee", visitorInitials: "ML", assistantId: "acme-support", assistantName: "Acme Support", lastMessage: "How do I upgrade my plan?", time: "12m", messageCount: 3, status: "open", channel: "web" },
  { id: "c3", visitor: "Anonymous", visitorInitials: "AN", assistantId: "sales-copilot", assistantName: "Sales Copilot", lastMessage: "Can I book a demo for Thursday?", time: "34m", messageCount: 4, status: "open", channel: "web" },
  { id: "c4", visitor: "Lea Martin", visitorInitials: "LM", assistantId: "acme-support", assistantName: "Acme Support", lastMessage: "I need help with SSO setup", time: "1h", messageCount: 8, status: "escalated", channel: "slack" },
  { id: "c5", visitor: "David Osei", visitorInitials: "DO", assistantId: "acme-support", assistantName: "Acme Support", lastMessage: "Where do I find my API key?", time: "2h", messageCount: 2, status: "resolved", channel: "web" },
  { id: "c6", visitor: "Yuki Tanaka", visitorInitials: "YT", assistantId: "sales-copilot", assistantName: "Sales Copilot", lastMessage: "What's the difference between Growth and Scale?", time: "3h", messageCount: 5, status: "resolved", channel: "web" },
];

export const messagesById: Record<string, Message[]> = {
  c2: [
    { id: "m1", role: "user", content: "Hi! How do I upgrade my plan?", time: "10:24" },
    { id: "m2", role: "assistant", content: "You can upgrade any time from Settings → Billing. Choose the plan you'd like and your card will be pre-filled. The change takes effect immediately and you'll only be billed the prorated amount.", time: "10:24", sources: [{ title: "Billing & plans", url: "/help/billing" }] },
    { id: "m3", role: "user", content: "Do I get the annual discount if I switch mid-cycle?", time: "10:25" },
    { id: "m4", role: "assistant", content: "Yes — switching to annual mid-cycle applies the 20% discount and credits your unused monthly balance to the new plan.", time: "10:25", sources: [{ title: "Annual pricing FAQ", url: "/help/annual" }] },
  ],
};

export const analyticsSeries = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  conversations: 40 + Math.round(Math.sin(i / 3) * 15) + Math.round(Math.random() * 20),
  messages: 240 + Math.round(Math.sin(i / 2) * 60) + Math.round(Math.random() * 80),
}));

export const topTopics = [
  { topic: "Billing & upgrades", count: 214 },
  { topic: "SSO / login", count: 168 },
  { topic: "API rate limits", count: 132 },
  { topic: "Refunds", count: 88 },
  { topic: "Feature requests", count: 61 },
];

export const unansweredQuestions = [
  "How do I export conversations to CSV?",
  "Is there a SOC 2 report I can download?",
  "Can I use a custom domain for the widget?",
  "Does the SDK support React Native?",
];

export const purposes = [
  { id: "support", title: "Customer Support", description: "Answer questions about your product and reduce ticket volume.", icon: "LifeBuoy" },
  { id: "sales", title: "Sales Assistant", description: "Qualify leads, answer pricing questions and book demos.", icon: "TrendingUp" },
  { id: "product", title: "Product Expert", description: "Guide users through features and best practices.", icon: "Sparkles" },
  { id: "docs", title: "Documentation Assistant", description: "Help developers find the right page in your docs.", icon: "BookOpen" },
  { id: "leads", title: "Lead Generation", description: "Capture contact details from website visitors.", icon: "UserPlus" },
  { id: "custom", title: "Custom Assistant", description: "Start blank and shape it however you like.", icon: "Wand2" },
] as const;
