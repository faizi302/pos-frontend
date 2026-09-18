import Badge from "@/components/ui/Badge";

export default function StatusBadge({ active }) {
  return active ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="neutral">Inactive</Badge>
  );
}
