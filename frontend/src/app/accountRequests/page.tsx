"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type AccountCreationRequest,
  approveAccountCreationRequest,
  getAccountCreationRequests,
  rejectAccountCreationRequest,
} from "@/api/accountCreationRequests";

type PendingAction = {
  id: string;
  type: "approve" | "reject";
} | null;

function formatRequestedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export default function AccountRequestsPage() {
  const [requests, setRequests] = useState<AccountCreationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadRequests = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextRequests = await getAccountCreationRequests(controller.signal);
      setRequests(nextRequests);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setRequests([]);
      setLoadError(getErrorMessage(error, "Unable to load account requests."));
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadRequests();
    return () => abortRef.current?.abort();
  }, [loadRequests]);

  const visibleRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) => {
      return (
        request.email.toLowerCase().includes(query) || request.name.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  const handleApprove = async (request: AccountCreationRequest) => {
    setPendingAction({ id: request.id, type: "approve" });
    setActionError(null);

    try {
      await approveAccountCreationRequest(request.id);
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (error) {
      setActionError(getErrorMessage(error, `Unable to approve ${request.email}.`));
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (request: AccountCreationRequest) => {
    setPendingAction({ id: request.id, type: "reject" });
    setActionError(null);

    try {
      await rejectAccountCreationRequest(request.id);
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (error) {
      setActionError(getErrorMessage(error, `Unable to reject ${request.email}.`));
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-[30px] border border-[#d9d9d9] bg-white p-6 text-sm text-[#6c6c6c] shadow-sm">
        Loading account requests...
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-[30px] border border-[#d9d9d9] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#484848]">{loadError}</p>
        <button
          className="mt-3 rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={() => void loadRequests()}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-[#d9d9d9] bg-white px-5 pb-[31px] pt-[20px]">
      <div className="flex flex-col gap-[30px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[28px] font-bold leading-tight text-black">
              Account Requests
            </h1>
            <p className="mt-1 text-[14px] text-[#6c6c6c]">
              Review pending admin account creation requests.
            </p>
          </div>

          <label className="relative block w-full md:w-[363px]">
            <span className="sr-only">Search account requests</span>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white px-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none"
            />
          </label>
        </div>

        {actionError ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="border-b border-black px-6 py-4">
              <div className="grid grid-cols-[1.3fr_1.6fr_1.2fr_1fr] items-center gap-4 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px] text-black">
                <span>Name</span>
                <span>Email</span>
                <span>Requested</span>
                <span className="text-right">Actions</span>
              </div>
            </div>

            {visibleRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6c6c6c]">
                {searchQuery.trim()
                  ? "No account requests match your search."
                  : "No pending account requests."}
              </div>
            ) : (
              visibleRequests.map((request, index) => {
                const isPending = pendingAction?.id === request.id;
                const striped = index % 2 === 0;

                return (
                  <div
                    key={request.id}
                    className={`border-b border-[#b4b4b4] px-6 py-4 ${
                      striped ? "bg-[#f2f9f8]" : "bg-white"
                    }`}
                  >
                    <div className="grid grid-cols-[1.3fr_1.6fr_1.2fr_1fr] items-center gap-4">
                      <span className="text-[14px] font-medium text-black">
                        {request.name || "Unspecified"}
                      </span>
                      <span className="text-[14px] text-[#484848]">{request.email}</span>
                      <span className="text-[14px] text-[#484848]">
                        {formatRequestedAt(request.createdAt)}
                      </span>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleReject(request)}
                          className="rounded-[40px] border border-[#b4b4b4] px-4 py-2 text-[14px] font-semibold text-[#484848] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingAction?.id === request.id && pendingAction.type === "reject"
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleApprove(request)}
                          className="rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#327f7f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingAction?.id === request.id && pendingAction.type === "approve"
                            ? "Approving..."
                            : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
