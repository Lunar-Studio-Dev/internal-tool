"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, FileText, MoreHorizontal, Copy, Loader2, CheckCircle2, Clock, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Markdown } from "@/components/markdown";
import { deleteQuotation, getRealtimeToken } from "./actions";
import { useRealtime } from "inngest/react";
import { quotationChannel } from "@/inngest/channels/quotation";

// ─── Status Badge Component ───
function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "pending":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    <Clock className="h-3 w-3" />
                    Pending
                </span>
            );
        case "processing":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Generating AI...
                </span>
            );
        case "saving":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    <Save className="h-3 w-3 animate-pulse" />
                    Saving...
                </span>
            );
        case "completed":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                </span>
            );
        case "failed":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                    <Loader2 className="h-3 w-3" />
                    Failed
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {status}
                </span>
            );
    }
}

// ─── Per-Row Component with Realtime Subscription ───
function QuotationRow({
    quote,
    onView,
    onDelete,
}: {
    quote: any;
    onView: (quote: any) => void;
    onDelete: (id: string) => void;
}) {
    const router = useRouter();
    const isInProgress = quote.status !== "completed" && quote.status !== "failed";

    const { messages } = useRealtime({
        channel: quotationChannel({ quotationId: quote.id }),
        topics: ["status"] as const,
        token: () => getRealtimeToken(quote.id),
        enabled: isInProgress,
    });

    const liveStatus = messages?.byTopic?.status?.data?.status;
    const displayStatus = liveStatus || quote.status;

    // When status reaches "completed" via realtime, refresh page to get full content
    useEffect(() => {
        if (liveStatus === "completed") {
            router.refresh();
        }
    }, [liveStatus, router]);

    return (
        <TableRow className="cursor-default hover:bg-muted/30">
            <TableCell className="font-medium pl-6 text-xs text-muted-foreground">{quote.id}</TableCell>
            <TableCell className="font-semibold text-foreground">
                <div className="flex flex-col">
                    <span>{quote.name}</span>
                    {quote.description && (
                        <span className="text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5">
                            {quote.description}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500 opacity-70 shrink-0" />
                    <span className="truncate max-w-[120px] lg:max-w-none">{quote.template?.name || "Unknown Template"}</span>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <StatusBadge status={displayStatus} />
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                {new Date(quote.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}
            </TableCell>
            <TableCell className="text-right pr-6">
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onView(quote)}
                            disabled={displayStatus !== "completed"}
                        >
                            View Document
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => onDelete(quote.id)}
                        >
                            Delete Record
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}

// ─── Main Ledger Page ───
export default function QuotationsClient({ initialQuotations }: { initialQuotations: any[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewQuotation, setViewQuotation] = useState<any | null>(null);

    const filteredQuotations = initialQuotations.filter((q) =>
        q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to permanently delete this quotation record?")) {
            try {
                await deleteQuotation(id);
                toast.success("Quotation deleted successfully.");
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete quotation.");
            }
        }
    }

    const handleCopy = () => {
        if (viewQuotation?.content) {
            navigator.clipboard.writeText(viewQuotation.content);
            toast.success("Raw quotation copied to clipboard!");
        }
    };

    return (
        <div className="flex flex-col space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Client Quotations</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage and track all generated client proposals.</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or ID..."
                            className="pl-9 w-full sm:w-[200px] md:w-[280px] bg-background"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Link href="/dashboard/quotations/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Quotation
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Ledger Table Section */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-x-auto">
                <Table className="min-w-[500px]">
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[100px] pl-6">Quote ID</TableHead>
                            <TableHead>Quotation Name</TableHead>
                            <TableHead className="hidden sm:table-cell">Base Template Used</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Date</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredQuotations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No quotations found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredQuotations.map((quote) => (
                                <QuotationRow
                                    key={quote.id}
                                    quote={quote}
                                    onView={setViewQuotation}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Quotation View Modal */}
            <Dialog
                open={!!viewQuotation}
                onOpenChange={(open) => { if (!open) setViewQuotation(null); }}
            >
                <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto w-[90vw]">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-8">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="h-6 w-6 text-indigo-500" />
                                {viewQuotation?.name}
                            </DialogTitle>
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Raw
                            </Button>
                        </div>
                        <div className="text-base text-muted-foreground mt-2 border-b pb-4">
                            {viewQuotation?.description || "No description provided."}
                        </div>
                    </DialogHeader>

                    <div className="mt-2 py-4">
                        <Markdown content={viewQuotation?.content || "*No content available.*"} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
