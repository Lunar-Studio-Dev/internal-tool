"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Plus, FileText, MoreHorizontal, Copy } from "lucide-react";
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
import { deleteQuotation } from "./actions";

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
                            <TableHead className="hidden md:table-cell">Date</TableHead>
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
                                <TableRow key={quote.id} className="cursor-default hover:bg-muted/30">
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
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
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
                                                    onClick={() => setViewQuotation(quote)}
                                                >
                                                    View Document
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                                    onClick={() => handleDelete(quote.id)}
                                                >
                                                    Delete Record
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
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
