"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, KeyRound, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  type AiModelType,
} from "@/lib/ai-settings";
import { useAiSettings } from "@/store/useAiSettings";

export default function SettingsClient() {
  const {
    ai_model_type,
    customModelId,
    customApiKey,
    setAiModelType,
    setCustomModelId,
    setCustomApiKey,
    resetToDefault,
  } = useAiSettings();

  const [draftType, setDraftType] = useState<AiModelType>(ai_model_type);
  const [draftModelId, setDraftModelId] = useState(customModelId);
  const [draftApiKey, setDraftApiKey] = useState(customApiKey);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraftType(ai_model_type);
    setDraftModelId(customModelId);
    setDraftApiKey(customApiKey);
    setHydrated(true);
  }, [ai_model_type, customModelId, customApiKey]);

  const handleSave = () => {
    if (draftType === "custom") {
      if (!draftModelId.trim() || !draftApiKey.trim()) {
        toast.error("Custom mode requires both a model and an API key.");
        return;
      }
    }

    setAiModelType(draftType);
    setCustomModelId(draftModelId);
    setCustomApiKey(draftApiKey);
    toast.success("AI settings saved to this browser.");
  };

  const handleReset = () => {
    resetToDefault();
    setDraftType("default");
    setDraftModelId(AVAILABLE_GEMINI_MODELS[0].id);
    setDraftApiKey("");
    toast.success("Reset to default AI settings.");
  };

  if (!hydrated) {
    return (
      <div className="flex flex-col space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-7 w-7 text-indigo-600" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure how quotations are generated. Model preferences stay in your
          browser only — nothing is saved to the database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            AI Model
          </CardTitle>
          <CardDescription>
            Choose Lunar&apos;s default Gemini setup or bring your own Google AI
            Studio API key and model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            value={draftType}
            onValueChange={(value) => setDraftType(value as AiModelType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="default">Default</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="default" className="mt-4 space-y-3">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Lunar default configuration
                </div>
                <p className="text-sm text-muted-foreground">
                  Uses the platform Gemini API key and{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {DEFAULT_GEMINI_MODEL}
                  </code>
                  . No personal key is required.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-model">Gemini model</Label>
                <Select
                  value={draftModelId}
                  onValueChange={(value) => setDraftModelId(value || "")}
                >
                  <SelectTrigger id="gemini-model" className="bg-background">
                    <SelectValue placeholder="Select a Gemini model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col items-start">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-api-key" className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5" />
                  Google API key
                </Label>
                <Input
                  id="gemini-api-key"
                  type="password"
                  autoComplete="off"
                  value={draftApiKey}
                  onChange={(e) => setDraftApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="bg-background shadow-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Stored only in this browser&apos;s localStorage. It is sent with
                  each generate request so Inngest can call Gemini, and is never
                  written to the database.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset to default
            </Button>
            <Button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
