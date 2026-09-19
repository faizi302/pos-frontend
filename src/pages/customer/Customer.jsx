import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Users,
  Eye,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

import CustomerForm from "./CustomerForm";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useRestoreCustomerMutation,
} from "../../features/customer/customerApi";

const PERMISSIONS = {
  CREATE: "customers.create",
  READ: "customers.read",
  UPDATE: "customers.update",
  DELETE: "customers.delete",
};

export default function Customer() {
  const { can } = usePermissions();

  // =====================================================
  // FILTER STATE
  // =====================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // =====================================================
  // MODAL STATE
  // =====================================================

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleting, setDeleting] = useState(null);
  const [restoring, setRestoring] = useState(null);

  // =====================================================
  // GET CUSTOMERS
  // =====================================================

  const {
    data: customerResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCustomersQuery({
    search: search.trim() || undefined,
    isActive:
      statusFilter === "all"
        ? undefined
        : statusFilter === "active",
    page: 1,
    limit: 100,
  });

  // =====================================================
  // NORMALIZE CUSTOMER RESPONSE
  // =====================================================

  const customers = useMemo(() => {
    if (Array.isArray(customerResponse)) {
      return customerResponse;
    }

    if (Array.isArray(customerResponse?.customers)) {
      return customerResponse.customers;
    }

    if (Array.isArray(customerResponse?.data)) {
      return customerResponse.data;
    }

    return [];
  }, [customerResponse]);

  const pagination =
    customerResponse?.pagination || null;

  // =====================================================
  // MUTATIONS
  // =====================================================

  const [
    createCustomer,
    { isLoading: creating },
  ] = useCreateCustomerMutation();

  const [
    updateCustomer,
    { isLoading: updating },
  ] = useUpdateCustomerMutation();

  const [
    deleteCustomer,
    { isLoading: deletingCustomer },
  ] = useDeleteCustomerMutation();

  const [
    restoreCustomer,
    { isLoading: restoringCustomer },
  ] = useRestoreCustomerMutation();

  // =====================================================
  // FILTER CUSTOMERS
  //
  // Backend already performs search/filtering.
  // This local filter is only an additional UI safeguard.
  // =====================================================

  const filteredCustomers = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    return customers.filter((customer) => {
      // -------------------------------------------------
      // NAME
      // -------------------------------------------------

      const customerName =
        customer?.name?.toLowerCase() || "";

      // -------------------------------------------------
      // PHONE
      // -------------------------------------------------

      const phone =
        customer?.phone?.toLowerCase() || "";

      // -------------------------------------------------
      // ALTERNATE PHONE
      // -------------------------------------------------

      const alternatePhone =
        customer?.alternatePhone?.toLowerCase() || "";

      // -------------------------------------------------
      // EMAIL
      // -------------------------------------------------

      const email =
        customer?.email?.toLowerCase() || "";

      // -------------------------------------------------
      // CITY
      // -------------------------------------------------

      const city =
        customer?.city?.toLowerCase() || "";

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      const matchesSearch =
        !searchValue ||
        customerName.includes(searchValue) ||
        phone.includes(searchValue) ||
        alternatePhone.includes(searchValue) ||
        email.includes(searchValue) ||
        city.includes(searchValue);

      // -------------------------------------------------
      // STATUS
      // -------------------------------------------------

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          customer?.isActive === true) ||
        (statusFilter === "inactive" &&
          customer?.isActive === false);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    customers,
    search,
    statusFilter,
  ]);

  // =====================================================
  // OPEN CREATE
  // =====================================================

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  // =====================================================
  // OPEN EDIT
  // =====================================================

  function openEdit(customer) {
    setEditing(customer);
    setFormOpen(true);
  }

  // =====================================================
  // CLOSE FORM
  // =====================================================

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  async function handleSubmit(formData) {
    try {
      if (editing?._id) {
        await updateCustomer({
          id: editing._id,
          body: formData,
        }).unwrap();

        toast.success(
          "Customer updated successfully"
        );
      } else {
        await createCustomer(formData).unwrap();

        toast.success(
          "Customer created successfully"
        );
      }

      closeForm();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete() {
    if (!deleting?._id) {
      return;
    }

    try {
      await deleteCustomer(
        deleting._id
      ).unwrap();

      toast.success(
        "Customer deleted successfully"
      );

      setDeleting(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  }

  // =====================================================
  // RESTORE
  // =====================================================

  async function handleRestore() {
    if (!restoring?._id) {
      return;
    }

    try {
      await restoreCustomer(
        restoring._id
      ).unwrap();

      toast.success(
        "Customer restored successfully"
      );

      setRestoring(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  }

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    // ---------------------------------------------------
    // CUSTOMER
    // ---------------------------------------------------

    {
      key: "name",
      header: "Customer",

      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted-action text-sm font-semibold text-primary">
            {row?.name
              ?.charAt(0)
              ?.toUpperCase() || "C"}
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-primary">
              {row?.name || "—"}
            </span>

            {row?.email && (
              <span className="truncate text-xs text-secondary">
                {row.email}
              </span>
            )}
          </div>
        </div>
      ),
    },

    // ---------------------------------------------------
    // PHONE
    // ---------------------------------------------------

    {
      key: "phone",
      header: "Phone",

      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-primary">
            {row?.phone || "—"}
          </span>

          {row?.alternatePhone && (
            <span className="text-xs text-secondary">
              {row.alternatePhone}
            </span>
          )}
        </div>
      ),
    },

    // ---------------------------------------------------
    // CITY
    // ---------------------------------------------------

    {
      key: "city",
      header: "City",

      render: (row) =>
        row?.city || "—",
    },

    // ---------------------------------------------------
    // OPENING BALANCE
    // ---------------------------------------------------

    {
      key: "openingBalance",
      header: "Opening Balance",

      render: (row) => (
        <span className="font-mono text-sm text-primary">
          Rs.{" "}
          {Number(
            row?.openingBalance || 0
          ).toLocaleString()}
        </span>
      ),
    },

    // ---------------------------------------------------
    // CREDIT LIMIT
    // ---------------------------------------------------

    {
      key: "creditLimit",
      header: "Credit Limit",

      render: (row) => (
        <span className="font-mono text-sm text-primary">
          Rs.{" "}
          {Number(
            row?.creditLimit || 0
          ).toLocaleString()}
        </span>
      ),
    },

    // ---------------------------------------------------
    // STATUS
    // ---------------------------------------------------

    {
      key: "isActive",
      header: "Status",

      render: (row) => (
        <StatusBadge
          active={row?.isActive}
        />
      ),
    },
  ];

  // =====================================================
  // API ERROR
  // =====================================================

  const apiErrorMessage = isError
    ? getApiErrorMessage(error)
    : "";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Customers"
        description="Manage your customers and their account information."
        actions={
          can(PERMISSIONS.CREATE) && (
            <Button
              icon={Plus}
              onClick={openCreate}
            >
              New Customer
            </Button>
          )
        }
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        {/* SEARCH */}

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customers..."
        />

        {/* STATUS */}

        <Select
          options={[
            {
              value: "all",
              label: "All statuses",
            },
            {
              value: "active",
              label: "Active",
            },
            {
              value: "inactive",
              label: "Inactive",
            },
          ]}
          value={statusFilter}
          placeholder="All statuses"
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="sm:w-44"
        />
      </div>

      {/* =================================================
          TABLE STATES
      ================================================= */}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description={
            apiErrorMessage ||
            "Unable to load customers."
          }
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            search ||
            statusFilter !== "all"
              ? "Try changing your search or filters."
              : "Create your first customer to get started."
          }
          actionLabel={
            can(PERMISSIONS.CREATE)
              ? "New Customer"
              : undefined
          }
          onAction={
            can(PERMISSIONS.CREATE)
              ? openCreate
              : undefined
          }
        />
      ) : (
        <>
          {/* =================================================
              DATA TABLE
          ================================================= */}

          <DataTable
            columns={columns}
            data={filteredCustomers}
            actions={(row) => (
              <div className="flex justify-end gap-1">
                {/* VIEW */}

                {can(PERMISSIONS.READ) && (
                  <button
                    type="button"
                    aria-label="View customer"
                    onClick={() => {
                      // Customer detail page can be connected here.
                      // Example:
                      // navigate(`/customers/${row._id}`);
                    }}
                    className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}

                {/* EDIT */}

                {can(PERMISSIONS.UPDATE) && (
                  <button
                    type="button"
                    aria-label="Edit customer"
                    onClick={() =>
                      openEdit(row)
                    }
                    className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {/* RESTORE */}

                {can(PERMISSIONS.UPDATE) &&
                  row?.isActive === false && (
                    <button
                      type="button"
                      aria-label="Restore customer"
                      onClick={() =>
                        setRestoring(row)
                      }
                      className="rounded-lg p-1.5 text-secondary hover:bg-green-500/10 hover:text-green-600"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}

                {/* DELETE */}

                {can(PERMISSIONS.DELETE) &&
                  row?.isActive !== false && (
                    <button
                      type="button"
                      aria-label="Delete customer"
                      onClick={() =>
                        setDeleting(row)
                      }
                      className="rounded-lg p-1.5 text-secondary hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
            )}
          />

          {/* =================================================
              PAGINATION INFO
          ================================================= */}

          {pagination &&
            pagination.total > 0 && (
              <div className="mt-4 text-sm text-secondary">
                Showing{" "}
                {filteredCustomers.length} of{" "}
                {pagination.total} customers
              </div>
            )}
        </>
      )}

      {/* =====================================================
          CUSTOMER FORM MODAL
      ===================================================== */}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={
          editing
            ? "Edit Customer"
            : "Create Customer"
        }
      >
        <CustomerForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={
            creating || updating
          }
        />
      </Modal>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() =>
          setDeleting(null)
        }
        onConfirm={handleDelete}
        loading={deletingCustomer}
        title="Delete customer?"
        description={`This will remove "${deleting?.name}". The customer can be restored later.`}
      />

      {/* =====================================================
          RESTORE CONFIRMATION
      ===================================================== */}

      <ConfirmModal
        open={Boolean(restoring)}
        onClose={() =>
          setRestoring(null)
        }
        onConfirm={handleRestore}
        loading={restoringCustomer}
        title="Restore customer?"
        description={`Restore "${restoring?.name}" and make the customer active again?`}
      />
    </div>
  );
}