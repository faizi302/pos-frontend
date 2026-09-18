import { useState } from "react";
import toast from "react-hot-toast";
import { User } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";
import PageHeader from "@/components/common/PageHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { useUpdateUserMutation } from "@/features/users/usersApi";
import { setCurrentUser } from "@/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { getApiErrorMessage } from "@/utils/apiError";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function Account() {
  const { user } = usePermissions();
  const dispatch = useDispatch();
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await updateUser({ id: user._id, ...form }).unwrap();
      dispatch(setCurrentUser({ ...user, ...res.data }));
      toast.success("Account updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader title="Account" description="Your profile information." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar src={user?.avatar?.url} name={user?.name} size="lg" />
            <p className="mt-3 font-semibold text-primary">{user?.name}</p>
            <p className="text-sm text-secondary">{user?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Badge tone="brand">{user?.role?.name}</Badge>
              <StatusBadge active={user?.status === "active"} />
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-secondary pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Business</span>
              <span className="text-primary">{user?.business?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Business Type</span>
              <span className="text-primary">{user?.businessType?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Email Verified</span>
              <span className="text-primary">{user?.isEmailVerified ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Last Login</span>
              <span className="text-primary">{formatDate(user?.lastLoginAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Member Since</span>
              <span className="text-primary">{formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold text-primary">Edit profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input label="Email" value={user?.email || ""} disabled hint="Contact an admin to change your email." />

            <div className="flex justify-end">
              <Button type="submit" loading={isLoading}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
