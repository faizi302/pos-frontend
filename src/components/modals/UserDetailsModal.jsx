import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-secondary py-2.5 text-sm last:border-0">
      <span className="text-secondary">{label}</span>
      <span className="text-right font-medium text-primary">{value ?? "—"}</span>
    </div>
  );
}

export default function UserDetailsModal({ open, onClose, user }) {
  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="User Details">
      <div className="mb-5 flex items-center gap-3">
        <Avatar src={user.avatar?.url} name={user.name} size="lg" />
        <div>
          <p className="text-base font-semibold text-primary">{user.name}</p>
          <p className="text-sm text-secondary">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col">
        <Row label="Phone" value={user.phone} />
        <Row label="Role" value={<Badge tone="brand">{user.role?.name}</Badge>} />
        <Row label="Business" value={user.business?.name} />
        <Row label="Business Type" value={user.businessType?.name} />
        <Row label="Status" value={<StatusBadge active={user.status === "active"} />} />
        <Row
          label="Email Verification"
          value={
            user.isEmailVerified ? (
              <Badge tone="success">Verified</Badge>
            ) : (
              <Badge tone="warning">Unverified</Badge>
            )
          }
        />
        <Row
          label="Last Login"
          value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
        />
        <Row label="Created At" value={new Date(user.createdAt).toLocaleString()} />
        <Row label="Updated At" value={new Date(user.updatedAt).toLocaleString()} />
      </div>
    </Modal>
  );
}
