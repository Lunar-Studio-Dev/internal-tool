"use client";

import Link from "next/link";
import { Plus, Folder, FileText, Clock, ArrowRight, BarChart2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DashboardClientProps {
    user: { name: string; email: string };
    counts: { quotations: number; templates: number };
    recentQuotations: any[];
    recentTemplates: any[];
}

export default function DashboardClient({ user, counts, recentQuotations, recentTemplates }: DashboardClientProps) {
    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
            {/* Tier 1: Welcome & KPIs */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">👋 Welcome back, {user.name}!</h1>
                <p className="text-muted-foreground mt-1">Here is what's happening with your projects today.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.quotations}</div>
                        <p className="text-xs text-muted-foreground mt-1">Generated drafts</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Base Templates</CardTitle>
                        <Folder className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.templates}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active tech scopes</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {recentQuotations.length > 0 ? "Recent" : "None"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            {recentQuotations.length > 0
                                ? `Created: ${recentQuotations[0].name}`
                                : "No activity recorded yet"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tier 2: Quick Actions */}
            <div className="bg-muted/40 p-4 rounded-xl flex items-center gap-4">
                <h3 className="font-semibold text-sm mr-4 hidden md:block">🚀 Quick Actions</h3>
                <Link href="/dashboard/quotations/new">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-transform hover:-translate-y-0.5">
                        <Plus className="mr-2 h-4 w-4" /> Generate New Quotation
                    </Button>
                </Link>
                <Link href="/dashboard/templates">
                    <Button variant="outline" className="shadow-sm transition-transform hover:-translate-y-0.5 bg-background">
                        <Folder className="mr-2 h-4 w-4" /> Explore Templates
                    </Button>
                </Link>
            </div>

            {/* Tier 3: Split Grid Data View */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* 2/3 Column: Quotations Ledger */}
                <div className="col-span-1 md:col-span-2 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight">⏱️ Recent Quotations</h2>
                        <Link href="/dashboard/quotations">
                            <Button variant="link" className="text-indigo-600 p-0 h-auto font-medium">
                                View All <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="pl-4">Quote ID</TableHead>
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Template Used</TableHead>
                                    <TableHead className="text-right pr-4">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentQuotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No recent quotations found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recentQuotations.map((quote) => (
                                        <TableRow key={quote.id} className="hover:bg-muted/20">
                                            <TableCell className="font-medium text-xs text-muted-foreground pl-4">
                                                {quote.id.substring(quote.id.length - 8)}
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">
                                                {quote.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {quote.template?.name || "Unknown"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs pr-4">
                                                {new Date(quote.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* 1/3 Column: Active Templates */}
                <div className="col-span-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight">📋 Active Templates</h2>
                        <Link href="/dashboard/templates">
                            <Button variant="link" className="text-indigo-600 p-0 h-auto font-medium">
                                Manage <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex flex-col gap-3">
                        {recentTemplates.length === 0 ? (
                            <div className="border rounded-xl p-6 text-center text-muted-foreground text-sm">
                                No templates created yet.
                            </div>
                        ) : (
                            recentTemplates.map((template) => (
                                <Link key={template.id} href="/dashboard/templates">
                                    <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                                        <CardContent className="p-4 flex flex-col gap-1">
                                            <div className="font-semibold flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-indigo-500" />
                                                <span className="truncate">{template.name}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" />
                                                Updated {new Date(template.updatedAt).toLocaleDateString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
