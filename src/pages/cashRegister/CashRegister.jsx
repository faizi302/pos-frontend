import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  History,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";

import { toast } from "react-hot-toast";

import {
  useGetCurrentCashRegisterQuery,
  useGetCashRegistersQuery,
  useOpenCashRegisterMutation,
  useAddCashInMutation,
  useAddCashOutMutation,
  useCloseCashRegisterMutation,
} from "@/features/cashRegister/cashRegisterApi";


// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount);
};


const formatDateTime = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};


const formatDateInput = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
};


const getDifferenceClass = (difference) => {
  const value = Number(difference || 0);

  if (value > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-red-600 dark:text-red-400";
  }

  return "text-muted-foreground";
};


const getDifferenceLabel = (difference) => {
  const value = Number(difference || 0);

  if (value > 0) {
    return "Surplus";
  }

  if (value < 0) {
    return "Shortage";
  }

  return "Balanced";
};


// =====================================================
// INITIAL FORMS
// =====================================================

const initialOpenForm = {
  openingBalance: "",
  notes: "",
};


const initialCashForm = {
  amount: "",
  notes: "",
};


const initialCloseForm = {
  actualClosingBalance: "",
  notes: "",
};


// =====================================================
// MAIN COMPONENT
// =====================================================

const CashRegister = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [openModal, setOpenModal] = useState(false);
  const [cashInModal, setCashInModal] = useState(false);
  const [cashOutModal, setCashOutModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);

  const [openForm, setOpenForm] =
    useState(initialOpenForm);

  const [cashForm, setCashForm] =
    useState(initialCashForm);

  const [closeForm, setCloseForm] =
    useState(initialCloseForm);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(10);


  // ===================================================
  // CURRENT REGISTER
  // ===================================================

  const {
    data: currentRegister,
    isLoading: currentLoading,
    isFetching: currentFetching,
    error: currentError,
    refetch: refetchCurrent,
  } = useGetCurrentCashRegisterQuery();


  // ===================================================
  // REGISTER HISTORY
  // ===================================================

  const {
    data: registerData,
    isLoading: registersLoading,
    isFetching: registersFetching,
    error: registersError,
    refetch: refetchRegisters,
  } = useGetCashRegistersQuery({
    page,
    limit,
    status: status || undefined,
    search: search.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });


  // ===================================================
  // MUTATIONS
  // ===================================================

  const [
    openCashRegister,
    {
      isLoading: openingRegister,
    },
  ] =
    useOpenCashRegisterMutation();


  const [
    addCashIn,
    {
      isLoading: addingCashIn,
    },
  ] =
    useAddCashInMutation();


  const [
    addCashOut,
    {
      isLoading: addingCashOut,
    },
  ] =
    useAddCashOutMutation();


  const [
    closeCashRegister,
    {
      isLoading: closingRegister,
    },
  ] =
    useCloseCashRegisterMutation();


  // ===================================================
  // REGISTER LIST
  // ===================================================

  const registers =
    registerData?.registers || [];


  const pagination =
    registerData?.pagination || {
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
    };


  // ===================================================
  // REFRESH ALL
  // ===================================================

  const handleRefresh = () => {
    refetchCurrent();
    refetchRegisters();
  };


  // ===================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ===================================================

  useEffect(() => {
    setPage(1);
  }, [
    status,
    startDate,
    endDate,
  ]);


  // ===================================================
  // OPEN REGISTER
  // ===================================================

  const handleOpenRegister = async (e) => {
    e.preventDefault();

    const openingBalance =
      Number(
        openForm.openingBalance
      );

    if (
      !Number.isFinite(
        openingBalance
      ) ||
      openingBalance < 0
    ) {
      toast.error(
        "Please enter a valid opening balance."
      );

      return;
    }

    try {
      await openCashRegister({
        openingBalance,
        notes:
          openForm.notes.trim(),
      }).unwrap();

      toast.success(
        "Cash register opened successfully."
      );

      setOpenForm(
        initialOpenForm
      );

      setOpenModal(false);

      handleRefresh();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to open cash register."
      );
    }
  };


  // ===================================================
  // CASH IN
  // ===================================================

  const handleCashIn = async (e) => {
    e.preventDefault();

    const amount =
      Number(
        cashForm.amount
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Cash in amount must be greater than zero."
      );

      return;
    }

    try {
      await addCashIn({
        amount,
        notes:
          cashForm.notes.trim(),
      }).unwrap();

      toast.success(
        "Cash added successfully."
      );

      setCashForm(
        initialCashForm
      );

      setCashInModal(false);

      handleRefresh();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to add cash."
      );
    }
  };


  // ===================================================
  // CASH OUT
  // ===================================================

  const handleCashOut = async (e) => {
    e.preventDefault();

    const amount =
      Number(
        cashForm.amount
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Cash out amount must be greater than zero."
      );

      return;
    }

    const expectedBalance =
      Number(
        currentRegister?.expectedClosingBalance ||
          0
      );

    if (
      amount > expectedBalance
    ) {
      toast.error(
        "Cash out cannot make the expected balance negative."
      );

      return;
    }

    try {
      await addCashOut({
        amount,
        notes:
          cashForm.notes.trim(),
      }).unwrap();

      toast.success(
        "Cash removed successfully."
      );

      setCashForm(
        initialCashForm
      );

      setCashOutModal(false);

      handleRefresh();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to remove cash."
      );
    }
  };


  // ===================================================
  // CLOSE REGISTER
  // ===================================================

  const handleCloseRegister = async (
    e
  ) => {
    e.preventDefault();

    const actualClosingBalance =
      Number(
        closeForm.actualClosingBalance
      );

    if (
      !Number.isFinite(
        actualClosingBalance
      ) ||
      actualClosingBalance < 0
    ) {
      toast.error(
        "Please enter a valid actual closing balance."
      );

      return;
    }

    try {
      await closeCashRegister({
        actualClosingBalance,
        notes:
          closeForm.notes.trim(),
      }).unwrap();

      toast.success(
        "Cash register closed successfully."
      );

      setCloseForm(
        initialCloseForm
      );

      setCloseModal(false);

      handleRefresh();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Failed to close cash register."
      );
    }
  };


  // ===================================================
  // OPEN MODAL
  // ===================================================

  const handleOpenModal = () => {
    setOpenForm(
      initialOpenForm
    );

    setOpenModal(true);
  };


  // ===================================================
  // CASH IN MODAL
  // ===================================================

  const handleOpenCashInModal = () => {
    setCashForm(
      initialCashForm
    );

    setCashInModal(true);
  };


  // ===================================================
  // CASH OUT MODAL
  // ===================================================

  const handleOpenCashOutModal = () => {
    setCashForm(
      initialCashForm
    );

    setCashOutModal(true);
  };


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const handleOpenCloseModal = () => {
    setCloseForm({
      actualClosingBalance:
        currentRegister?.expectedClosingBalance ??
        "",
      notes: "",
    });

    setCloseModal(true);
  };


  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };


  // ===================================================
  // DERIVED DATA
  // ===================================================

  const hasOpenRegister =
    Boolean(
      currentRegister?._id
    );


  const expectedBalance = useMemo(
    () =>
      Number(
        currentRegister?.expectedClosingBalance ||
          0
      ),
    [currentRegister]
  );


  const currentCashSales =
    Number(
      currentRegister?.cashSales ||
        0
    );


  const currentCashExpenses =
    Number(
      currentRegister?.cashExpenses ||
        0
    );


  const currentCashRefunds =
    Number(
      currentRegister?.cashRefunds ||
        0
    );


  const currentCashIn =
    Number(
      currentRegister?.cashIn ||
        0
    );


  const currentCashOut =
    Number(
      currentRegister?.cashOut ||
        0
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />

              <span>
                POS Management
              </span>

              <span>/</span>

              <span>
                Cash Register
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Cash Register
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your daily cash, cash movements,
              and register closing.
            </p>
          </div>


          {/* HEADER ACTIONS */}

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                currentFetching ||
                registersFetching
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  currentFetching ||
                  registersFetching
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>


            {!hasOpenRegister && (
              <button
                type="button"
                onClick={
                  handleOpenModal
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />

                Open Register
              </button>
            )}

          </div>
        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {currentError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load current register
              </p>

              <p className="mt-1 text-sm">
                {currentError?.data?.message ||
                  "Please refresh the page and try again."}
              </p>
            </div>
          </div>
        )}


        {/* =================================================
            CURRENT REGISTER
        ================================================= */}

        <section className="rounded-2xl border border-border bg-card shadow-sm">

          <div className="border-b border-border p-5 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />

                  <h2 className="text-lg font-semibold">
                    Current Register
                  </h2>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your currently active cash register.
                </p>
              </div>


              {hasOpenRegister && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  Open
                </span>
              )}

            </div>
          </div>


          {currentLoading ? (
            <LoadingCard />
          ) : !hasOpenRegister ? (

            <EmptyRegisterState
              onOpen={handleOpenModal}
            />

          ) : (

            <div className="p-5 md:p-6">

              {/* REGISTER INFO */}

              <div className="grid gap-4 md:grid-cols-3">

                <InfoCard
                  icon={
                    <Banknote className="h-5 w-5" />
                  }
                  label="Register Number"
                  value={
                    currentRegister?.registerNumber ||
                    "-"
                  }
                />

                <InfoCard
                  icon={
                    <Clock3 className="h-5 w-5" />
                  }
                  label="Opened At"
                  value={formatDateTime(
                    currentRegister?.openedAt
                  )}
                />

                <InfoCard
                  icon={
                    <Wallet className="h-5 w-5" />
                  }
                  label="Opening Balance"
                  value={formatCurrency(
                    currentRegister?.openingBalance
                  )}
                />

              </div>


              {/* BALANCE */}

              <div className="mt-5 rounded-xl border border-border bg-muted/30 p-5">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Expected Closing Balance
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      {formatCurrency(
                        expectedBalance
                      )}
                    </p>
                  </div>


                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={
                        handleOpenCashInModal
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <ArrowDownToLine className="h-4 w-4" />

                      Cash In
                    </button>


                    <button
                      type="button"
                      onClick={
                        handleOpenCashOutModal
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      <ArrowUpFromLine className="h-4 w-4" />

                      Cash Out
                    </button>


                    <button
                      type="button"
                      onClick={
                        handleOpenCloseModal
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
                    >
                      <LockKeyhole className="h-4 w-4" />

                      Close Register
                    </button>

                  </div>

                </div>

              </div>


              {/* TOTALS */}

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                <SummaryCard
                  icon={
                    <DollarSign className="h-5 w-5" />
                  }
                  label="Cash Sales"
                  value={formatCurrency(
                    currentCashSales
                  )}
                />

                <SummaryCard
                  icon={
                    <Plus className="h-5 w-5" />
                  }
                  label="Cash In"
                  value={formatCurrency(
                    currentCashIn
                  )}
                />

                <SummaryCard
                  icon={
                    <Minus className="h-5 w-5" />
                  }
                  label="Cash Expenses"
                  value={formatCurrency(
                    currentCashExpenses
                  )}
                />

                <SummaryCard
                  icon={
                    <ArrowDownToLine className="h-5 w-5" />
                  }
                  label="Cash Refunds"
                  value={formatCurrency(
                    currentCashRefunds
                  )}
                />

                <SummaryCard
                  icon={
                    <ArrowUpFromLine className="h-5 w-5" />
                  }
                  label="Cash Out"
                  value={formatCurrency(
                    currentCashOut
                  )}
                />

              </div>


              {/* NOTES */}

              {currentRegister?.notes && (
                <div className="mt-5 rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </p>

                  <p className="mt-2 text-sm">
                    {currentRegister.notes}
                  </p>
                </div>
              )}

            </div>
          )}

        </section>


        {/* =================================================
            HISTORY
        ================================================= */}

        <section className="rounded-2xl border border-border bg-card shadow-sm">

          <div className="border-b border-border p-5 md:p-6">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />

                  <h2 className="text-lg font-semibold">
                    Register History
                  </h2>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  View previous cash register sessions.
                </p>
              </div>


              <div className="flex flex-wrap gap-2">

                {/* SEARCH */}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search register..."
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-56"
                  />
                </div>


                {/* STATUS */}

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="open">
                    Open
                  </option>

                  <option value="closed">
                    Closed
                  </option>
                </select>


                {/* CLEAR */}

                {(search ||
                  status ||
                  startDate ||
                  endDate) && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted"
                  >
                    <X className="h-4 w-4" />

                    Clear
                  </button>
                )}

              </div>

            </div>


            {/* DATE FILTERS */}

            <div className="mt-4 flex flex-wrap gap-3">

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>


              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) =>
                    setEndDate(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

            </div>

          </div>


          {/* HISTORY TABLE */}

          {registersLoading ? (
            <TableLoading />
          ) : registersError ? (

            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

              <p className="mt-3 font-semibold">
                Failed to load registers
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {registersError?.data?.message ||
                  "Please try again."}
              </p>

              <button
                type="button"
                onClick={
                  refetchRegisters
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />

                Retry
              </button>
            </div>

          ) : registers.length === 0 ? (

            <EmptyHistory />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">

                    <th className="px-5 py-4">
                      Register
                    </th>

                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Opened
                    </th>

                    <th className="px-5 py-4">
                      Opening
                    </th>

                    <th className="px-5 py-4">
                      Expected
                    </th>

                    <th className="px-5 py-4">
                      Actual
                    </th>

                    <th className="px-5 py-4">
                      Difference
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                  </tr>
                </thead>


                <tbody className="divide-y divide-border">

                  {registers.map(
                    (register) => {
                      const difference =
                        Number(
                          register?.difference ||
                            0
                        );

                      return (
                        <tr
                          key={
                            register._id
                          }
                          className="transition hover:bg-muted/20"
                        >

                          {/* REGISTER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Banknote className="h-4 w-4" />
                              </div>

                              <div>
                                <p className="font-semibold">
                                  {
                                    register.registerNumber
                                  }
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {
                                    register.business?.name ||
                                    "-"
                                  }
                                </p>
                              </div>

                            </div>

                          </td>


                          {/* USER */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-medium">
                              {
                                register.user
                                  ?.name ||
                                "-"
                              }
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {
                                register.user
                                  ?.email ||
                                "-"
                              }
                            </p>

                          </td>


                          {/* OPENED */}

                          <td className="px-5 py-4">

                            <p className="text-sm">
                              {formatDateTime(
                                register.openedAt
                              )}
                            </p>

                            {register.closedAt && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Closed:{" "}
                                {formatDateTime(
                                  register.closedAt
                                )}
                              </p>
                            )}

                          </td>


                          {/* OPENING */}

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(
                              register.openingBalance
                            )}
                          </td>


                          {/* EXPECTED */}

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(
                              register.expectedClosingBalance
                            )}
                          </td>


                          {/* ACTUAL */}

                          <td className="px-5 py-4 font-medium">
                            {register.actualClosingBalance !==
                            null &&
                            register.actualClosingBalance !==
                            undefined
                              ? formatCurrency(
                                  register.actualClosingBalance
                                )
                              : "-"}
                          </td>


                          {/* DIFFERENCE */}

                          <td className="px-5 py-4">

                            {register.status ===
                            "closed" ? (
                              <div>
                                <p
                                  className={`font-semibold ${getDifferenceClass(
                                    difference
                                  )}`}
                                >
                                  {difference >
                                  0
                                    ? "+"
                                    : ""}
                                  {formatCurrency(
                                    difference
                                  )}
                                </p>

                                <p
                                  className={`text-xs ${getDifferenceClass(
                                    difference
                                  )}`}
                                >
                                  {getDifferenceLabel(
                                    difference
                                  )}
                                </p>
                              </div>
                            ) : (
                              "-"
                            )}

                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {register.status ===
                            "open" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                Open
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5" />

                                Closed
                              </span>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}


          {/* PAGINATION */}

          {!registersLoading &&
            registers.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {registers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {pagination.total}
                  </span>{" "}
                  registers
                </p>


                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={
                      page <= 1 ||
                      registersFetching
                    }
                    onClick={() =>
                      setPage(
                        (prev) =>
                          Math.max(
                            prev - 1,
                            1
                          )
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    Previous
                  </button>


                  <span className="px-2 text-sm font-medium">
                    {pagination.page} /{" "}
                    {pagination.totalPages ||
                      1}
                  </span>


                  <button
                    type="button"
                    disabled={
                      page >=
                        pagination.totalPages ||
                      registersFetching
                    }
                    onClick={() =>
                      setPage(
                        (prev) =>
                          Math.min(
                            prev + 1,
                            pagination.totalPages
                          )
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next

                    <ChevronRight className="h-4 w-4" />
                  </button>

                </div>

              </div>
            )}

        </section>

      </div>


      {/* =================================================
          OPEN REGISTER MODAL
      ================================================= */}

      <Modal
        open={openModal}
        onClose={() =>
          !openingRegister &&
          setOpenModal(false)
        }
        title="Open Cash Register"
        description="Start a new cash register session."
      >

        <form
          onSubmit={
            handleOpenRegister
          }
          className="space-y-5"
        >

          <FormField
            label="Opening Balance"
            required
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                PKR
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  openForm.openingBalance
                }
                onChange={(e) =>
                  setOpenForm(
                    (prev) => ({
                      ...prev,
                      openingBalance:
                        e.target.value,
                    })
                  )
                }
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-border bg-background py-3 pl-14 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FormField>


          <FormField label="Notes">
            <textarea
              value={
                openForm.notes
              }
              onChange={(e) =>
                setOpenForm(
                  (prev) => ({
                    ...prev,
                    notes:
                      e.target.value,
                  })
                )
              }
              rows={4}
              placeholder="Optional opening notes..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>


          <ModalActions
            onCancel={() =>
              setOpenModal(false)
            }
            submitText="Open Register"
            loading={
              openingRegister
            }
            icon={
              <LockKeyhole className="h-4 w-4" />
            }
          />

        </form>

      </Modal>


      {/* =================================================
          CASH IN MODAL
      ================================================= */}

      <Modal
        open={cashInModal}
        onClose={() =>
          !addingCashIn &&
          setCashInModal(false)
        }
        title="Add Cash"
        description="Add physical cash to the current register."
      >

        <form
          onSubmit={
            handleCashIn
          }
          className="space-y-5"
        >

          <FormField
            label="Amount"
            required
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                PKR
              </span>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={
                  cashForm.amount
                }
                onChange={(e) =>
                  setCashForm(
                    (prev) => ({
                      ...prev,
                      amount:
                        e.target.value,
                    })
                  )
                }
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-border bg-background py-3 pl-14 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FormField>


          <FormField label="Notes">
            <textarea
              value={
                cashForm.notes
              }
              onChange={(e) =>
                setCashForm(
                  (prev) => ({
                    ...prev,
                    notes:
                      e.target.value,
                  })
                )
              }
              rows={4}
              placeholder="Why is cash being added?"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>


          <ModalActions
            onCancel={() =>
              setCashInModal(
                false
              )
            }
            submitText="Add Cash"
            loading={
              addingCashIn
            }
            icon={
              <ArrowDownToLine className="h-4 w-4" />
            }
          />

        </form>

      </Modal>


      {/* =================================================
          CASH OUT MODAL
      ================================================= */}

      <Modal
        open={cashOutModal}
        onClose={() =>
          !addingCashOut &&
          setCashOutModal(false)
        }
        title="Remove Cash"
        description="Remove physical cash from the current register."
      >

        <div className="mb-5 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Current expected balance
          </p>

          <p className="mt-1 text-lg font-bold">
            {formatCurrency(
              expectedBalance
            )}
          </p>
        </div>


        <form
          onSubmit={
            handleCashOut
          }
          className="space-y-5"
        >

          <FormField
            label="Amount"
            required
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                PKR
              </span>

              <input
                type="number"
                min="0.01"
                step="0.01"
                max={
                  expectedBalance
                }
                value={
                  cashForm.amount
                }
                onChange={(e) =>
                  setCashForm(
                    (prev) => ({
                      ...prev,
                      amount:
                        e.target.value,
                    })
                  )
                }
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-border bg-background py-3 pl-14 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FormField>


          <FormField label="Notes">
            <textarea
              value={
                cashForm.notes
              }
              onChange={(e) =>
                setCashForm(
                  (prev) => ({
                    ...prev,
                    notes:
                      e.target.value,
                  })
                )
              }
              rows={4}
              placeholder="Why is cash being removed?"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>


          <ModalActions
            onCancel={() =>
              setCashOutModal(
                false
              )
            }
            submitText="Remove Cash"
            loading={
              addingCashOut
            }
            icon={
              <ArrowUpFromLine className="h-4 w-4" />
            }
          />

        </form>

      </Modal>


      {/* =================================================
          CLOSE REGISTER MODAL
      ================================================= */}

      <Modal
        open={closeModal}
        onClose={() =>
          !closingRegister &&
          setCloseModal(false)
        }
        title="Close Cash Register"
        description="Count the physical cash and close today's register."
      >

        <div className="mb-5 grid gap-3 sm:grid-cols-2">

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Expected
            </p>

            <p className="mt-1 text-lg font-bold">
              {formatCurrency(
                expectedBalance
              )}
            </p>
          </div>


          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Actual
            </p>

            <p className="mt-1 text-lg font-bold">
              {closeForm.actualClosingBalance
                ? formatCurrency(
                    closeForm.actualClosingBalance
                  )
                : "-"}
            </p>
          </div>

        </div>


        <form
          onSubmit={
            handleCloseRegister
          }
          className="space-y-5"
        >

          <FormField
            label="Actual Closing Balance"
            required
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                PKR
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  closeForm.actualClosingBalance
                }
                onChange={(e) =>
                  setCloseForm(
                    (prev) => ({
                      ...prev,
                      actualClosingBalance:
                        e.target.value,
                    })
                  )
                }
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-border bg-background py-3 pl-14 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              Enter the actual physical cash counted in the register.
            </p>
          </FormField>


          <FormField label="Notes">
            <textarea
              value={
                closeForm.notes
              }
              onChange={(e) =>
                setCloseForm(
                  (prev) => ({
                    ...prev,
                    notes:
                      e.target.value,
                  })
                )
              }
              rows={4}
              placeholder="Optional closing notes..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FormField>


          <ModalActions
            onCancel={() =>
              setCloseModal(
                false
              )
            }
            submitText="Close Register"
            loading={
              closingRegister
            }
            icon={
              <LockKeyhole className="h-4 w-4" />
            }
          />

        </form>

      </Modal>

    </div>
  );
};


// =====================================================
// INFO CARD
// =====================================================

const InfoCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-border bg-background p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-semibold">
            {value}
          </p>
        </div>

      </div>

    </div>
  );
};


// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-border bg-background p-4">

      <div className="flex items-center justify-between gap-3">

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 text-base font-bold">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>

      </div>

    </div>
  );
};


// =====================================================
// FORM FIELD
// =====================================================

const FormField = ({
  label,
  required = false,
  children,
}) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

    </div>
  );
};


// =====================================================
// MODAL
// =====================================================

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      <div
        className="absolute inset-0"
        onClick={onClose}
      />


      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-border p-5">

          <div className="pr-4">
            <h2 className="text-lg font-semibold">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>


          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

        </div>


        {/* BODY */}

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
};


// =====================================================
// MODAL ACTIONS
// =====================================================

const ModalActions = ({
  onCancel,
  submitText,
  loading,
  icon,
}) => {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-5">

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>


      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >

        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}

        {loading
          ? "Processing..."
          : submitText}

      </button>

    </div>
  );
};


// =====================================================
// EMPTY REGISTER
// =====================================================

const EmptyRegisterState = ({
  onOpen,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Wallet className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        No Open Register
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        There is currently no open cash register.
        Open a register to start processing today's
        cash transactions.
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />

        Open Register
      </button>

    </div>
  );
};


// =====================================================
// EMPTY HISTORY
// =====================================================

const EmptyHistory = () => {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <History className="h-7 w-7 text-muted-foreground" />
      </div>

      <h3 className="mt-4 text-base font-semibold">
        No Registers Found
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        No cash registers match your current filters.
      </p>

    </div>
  );
};


// =====================================================
// LOADING CARD
// =====================================================

const LoadingCard = () => {
  return (
    <div className="flex items-center justify-center px-5 py-16">

      <div className="flex items-center gap-3 text-sm text-muted-foreground">

        <Loader2 className="h-5 w-5 animate-spin" />

        Loading current register...

      </div>

    </div>
  );
};


// =====================================================
// TABLE LOADING
// =====================================================

const TableLoading = () => {
  return (
    <div className="space-y-3 p-5">

      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-lg bg-muted"
        />
      ))}

    </div>
  );
};


export default CashRegister;