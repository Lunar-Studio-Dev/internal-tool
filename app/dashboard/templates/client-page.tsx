"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Search, FileText, Plus, Copy, Edit, Trash2 } from "lucide-react";
import { createTemplate, deleteTemplate } from "./actions";
import { Markdown } from "@/components/markdown";

export default function TemplatesClient({ initialTemplates }: { initialTemplates: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewTemplate, setViewTemplate] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTemplates = initialTemplates.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await createTemplate(formData);
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to create template.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteTemplate(id);
            } catch (error) {
                console.error(error);
                alert("Failed to delete template.");
            }
        }
    }

    return (
        <div className="flex flex-col space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Templates Base</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage reusable project template patterns.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search templates..."
                            className="pl-9 w-[200px] md:w-[280px] bg-background"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger render={<Button />}>
                            <Plus className="h-4 w-4 mr-2" /> Create Template
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] h-[40rem] overflow-y-auto">
                            <form onSubmit={onSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Create Base Template</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-5 py-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Template Name</label>
                                        <Input name="name" required placeholder="e.g. B2B E-Commerce App" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Short Description</label>
                                        <Input name="description" placeholder="Brief outline of this template pattern..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Base Requirements (Markdown)</label>
                                        <Textarea
                                            name="content"
                                            required
                                            placeholder="# System Overview&#10;Write the default constraints..."
                                            className="min-h-[220px] max-h-[500px] font-mono text-sm leading-relaxed"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create"}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Templates Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                    <Card
                        key={template.id}
                        className="relative group flex flex-col transition-shadow hover:shadow-md cursor-pointer"
                        onClick={() => setViewTemplate(template)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5 pr-6">
                                    <CardTitle className="flex items-start gap-2 text-lg leading-tight">
                                        <FileText className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{template.name}</span>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 text-sm">
                                        {template.description || "No description provided."}
                                    </CardDescription>
                                </div>
                                <div
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted" />}>
                                            <MoreVertical className="h-4 w-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Edit className="h-4 w-4 mr-2 text-slate-500" /> Edit Base
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                                <Copy className="h-4 w-4 mr-2 text-slate-500" /> Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                                onClick={() => handleDelete(template.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-4 border-t text-xs text-muted-foreground bg-muted/20">
                            Updated on {new Date(template.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </CardFooter>
                    </Card>
                ))}

                {filteredTemplates.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No templates found</h3>
                        <p className="max-w-sm mt-1">Create your first base template to standardize quotation generation.</p>
                        <Button
                            variant="outline"
                            className="mt-6"
                            onClick={() => setIsOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    </div>
                )}
            </div>

            {/* Template Markdown Viewer Modal */}
            <Dialog
                open={!!viewTemplate}
                onOpenChange={(open) => { if (!open) setViewTemplate(null); }}
            >
                <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto w-[90vw]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-indigo-500" />
                            {viewTemplate?.name}
                        </DialogTitle>
                        <div className="text-base text-muted-foreground mt-2 border-b pb-4">
                            {viewTemplate?.description || "No description provided."}
                        </div>
                    </DialogHeader>

                    <div className="mt-2 py-4">
                        <Markdown content={viewTemplate?.content || "*No markdown content available.*"} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
