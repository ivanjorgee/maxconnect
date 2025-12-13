import { StatusFunil } from "@prisma/client";
import { statusLabels, statusTone } from "@/lib/dictionaries";
import { Badge } from "@/components/ui/badge";

type Props = {
  status: StatusFunil;
};

export function LeadStatusBadge({ status }: Props) {
  const tone = statusTone[status];
  const variant =
    tone === "success" ? "success" : tone === "warning" ? "warning" : tone === "danger" ? "danger" : "outline";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}
