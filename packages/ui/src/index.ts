export { cn } from './lib/utils';

export { Button, buttonVariants } from './components/ui/button';
export { Input } from './components/ui/input';
export { Textarea } from './components/ui/textarea';
export { Badge, StatusBadge } from './components/ui/badge';
export { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
export { Skeleton } from './components/ui/skeleton';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
export { Separator } from './components/ui/separator';
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './components/ui/table';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './components/ui/dialog';

export { DashboardShell } from './components/dashboard-shell';
export { PageHeader, PageToolbar, EmptyState, ErrorState, ProcessingState } from './components/page-header';
export { StepProgress, WIZARD_STEPS, type WizardStepId } from './components/step-progress';
export { MetricCard } from './components/metric-card';
export { CodeSnippet } from './components/code-snippet';
export { ChatPlayground, type ChatMessage } from './components/chat-playground';
export { AssistantPreview } from './components/assistant-preview';
export { InsightCard, IntegrationCard } from './components/insight-card';

// Legacy export for backward compatibility
export { DashboardShell as AppShell } from './components/dashboard-shell';
