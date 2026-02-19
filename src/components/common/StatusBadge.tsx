import { Badge } from "@/components/ui/badge";

type StatusType = "active" | "pending" | "inactive" | "rejected" | "critical" | "high" | "normal" | "completed" | "in_progress" | "CREDITED" | "DEBITED";

const styles: Record<StatusType, string> = {
  active: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  CREDITED: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  DEBITED: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  completed: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  pending: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20",
  in_progress: "bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/20",
  inactive: "bg-muted text-muted-foreground border-border hover:bg-muted",
  rejected: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  critical: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  high: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20",
  normal: "bg-info/15 text-info-foreground border-info/30 hover:bg-info/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = status as StatusType;
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${styles[s] || styles.normal}`}>
      {status.replace("_", " ")}
    </Badge>
  );
}
