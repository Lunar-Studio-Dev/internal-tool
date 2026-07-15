"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Building2, CheckCircle2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { createQuotation } from "../actions";

const DEFAULT_MARKDOWN = `# Project Summary\nProvide a high-level overview of the client's needs here.\n\n## Detail Requirements\n- Custom UI/UX Design\n- User Authentication\n- Payment Gateway Integration\n\n## Timeline Estimate\n- Phase 1: 2 Weeks\n- Phase 2: 4 Weeks\n\n> "Client requires highly secure local hosting."\n`;

export default function NewQuotationClient({ templates }: { templates: any[] }) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [templateId, setTemplateId] = useState<string>("");
    const [requirements, setRequirements] = useState(DEFAULT_MARKDOWN);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            const result = await createQuotation({
                name,
                description,
                requirements,
                templateId
            });

            if (!result?.success) {
                toast.error(result?.error || "Failed to generate quotation.");
                setIsGenerating(false);
                return;
            }

            toast.success("Generating Qutation Please wait!!");
            // Redirect smoothly back to the ledger upon success
            router.push("/dashboard/quotations");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate quotation.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/quotations">
                        <Button variant="ghost" size="icon" className="rounded-full shadow-sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Generate Quotation</h1>
                        <p className="text-muted-foreground text-xs mt-0.5">Drafting client details into professional proposals.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                    <Link href="/dashboard/quotations" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !name || !templateId}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                    >
                        {isGenerating ? (
                            <span className="flex items-center">Generating...</span>
                        ) : (
                            <span className="flex items-center"><Sparkles className="h-4 w-4 mr-2" /> Generate</span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Configuration Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 shrink-0">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Quotation Name
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Wayne Enterprises RAG Setup"
                        className="bg-background shadow-sm"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <AlignLeft className="h-4 w-4 text-muted-foreground" />
                        Short Description
                    </label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Internal Slack-based AI Assistant..."
                        className="bg-background shadow-sm"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        Base Template Selection
                    </label>
                    <Select value={templateId} onValueChange={(v) => setTemplateId(v || "")}>
                        <SelectTrigger className="bg-background shadow-sm">
                            <SelectValue placeholder="Select a base pattern to overlay requirements..." />
                        </SelectTrigger>
                        <SelectContent>
                            {templates.map((tmpl) => (
                                <SelectItem key={tmpl.id} value={tmpl.id}>
                                    {tmpl.name}
                                </SelectItem>
                            ))}
                            {templates.length === 0 && (
                                <SelectItem value="none" disabled>No templates generated yet</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Split Screen Workspace (Desktop) */}
            <div className="hidden md:flex flex-1 min-h-0 border rounded-xl overflow-hidden shadow-sm bg-background mt-2">
                <ResizablePanelGroup direction="horizontal" {...{} as any}>

                    {/* Left Panel: Raw Markdown Editor */}
                    <ResizablePanel defaultSize={50} minSize={30} className="bg-muted/10">
                        <div className="h-full flex flex-col">
                            <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between shrink-0">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Raw Requirements (Markdown)</span>
                            </div>
                            <Textarea
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                className="flex-1 w-full resize-none border-0 focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed bg-transparent rounded-none shadow-none focus-visible:shadow-none"
                                placeholder="Write the client's detailed constraints here..."
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right Panel: Live HTML Preview */}
                    <ResizablePanel defaultSize={50} minSize={30} className="bg-background">
                        <div className="h-full flex flex-col">
                            <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between shrink-0">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Live Document Preview</span>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-6 md:p-8">
                                    <Markdown content={requirements || "*Start typing to see the preview building...*"} />
                                </div>
                            </ScrollArea>
                        </div>
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>

            {/* Tabbed Workspace (Mobile) */}
            <div className="flex md:hidden flex-1 min-h-[500px] mt-2">
                <Tabs defaultValue="edit" className="w-full h-full flex flex-col">
                    <TabsList className="w-full grid grid-cols-2 shrink-0">
                        <TabsTrigger value="edit">✏️ Edit Req</TabsTrigger>
                        <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="flex-1 mt-2 border rounded-xl bg-muted/10 overflow-hidden flex flex-col min-h-[400px] overflow-y-auto">
                        <Textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            className="flex-1 w-full resize-none border-0 focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed bg-transparent rounded-none shadow-none focus-visible:shadow-none"
                            placeholder="Write constraints here..."
                        />
                    </TabsContent>

                    <TabsContent value="preview" className="flex-1 mt-2 mb-2 border rounded-xl bg-background overflow-hidden flex flex-col min-h-[400px] overflow-y-auto">
                        <ScrollArea className="flex-1">
                            <div className="p-4">
                                <Markdown content={requirements || "*Preview will appear here...*"} />
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
