"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type TabItem = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SectionTabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const SectionTabsContext = createContext<SectionTabsContextValue | null>(null);

function useSectionTabsContext() {
  const ctx = useContext(SectionTabsContext);
  if (!ctx) {
    throw new Error("SectionTabsList must be used within SectionTabs");
  }
  return ctx;
}

function extractTabItems(children: ReactNode): TabItem[] {
  const items: TabItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== SectionTabsTrigger) return;
    const props = child.props as ComponentProps<typeof SectionTabsTrigger>;
    items.push({
      value: props.value,
      label: props.children,
      disabled: props.disabled,
    });
  });
  return items;
}

function SectionTabsMobileSelect({ items }: { items: TabItem[] }) {
  const { value, onValueChange } = useSectionTabsContext();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select section" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SectionTabs({
  value,
  defaultValue = "",
  onValueChange,
  children,
  ...props
}: ComponentProps<typeof Tabs>) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value ?? internalValue;

  function handleValueChange(next: string) {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  }

  return (
    <SectionTabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <Tabs {...props} value={activeValue} onValueChange={handleValueChange}>
        {children}
      </Tabs>
    </SectionTabsContext.Provider>
  );
}

export function SectionTabsList({
  className,
  children,
  ...props
}: ComponentProps<typeof TabsList>) {
  const items = useMemo(() => extractTabItems(children), [children]);

  return (
    <>
      <div className="md:hidden">
        <SectionTabsMobileSelect items={items} />
      </div>
      <TabsList className={cn("hidden md:inline-flex", className)} {...props}>
        {children}
      </TabsList>
    </>
  );
}

export function SectionTabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsTrigger>) {
  return <TabsTrigger className={className} {...props} />;
}
