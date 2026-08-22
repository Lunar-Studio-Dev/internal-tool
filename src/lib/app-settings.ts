import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";

export type AppSettingsDto = {
  companyName: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  staleDays: number;
};

const DEFAULTS: AppSettingsDto = {
  companyName: "Lunar Studio",
  currency: "INR",
  dateFormat: "DD MMM YYYY",
  timezone: "Asia/Kolkata",
  staleDays: 14,
};

/** Cached singleton settings row. Creates defaults if missing. */
export const getAppSettings = cache(async (): Promise<AppSettingsDto> => {
  let row = await db.appSettings.findUnique({ where: { id: "singleton" } });
  if (!row) {
    row = await db.appSettings.create({ data: { id: "singleton", ...DEFAULTS } });
  }
  return {
    companyName: row.companyName,
    currency: row.currency,
    dateFormat: row.dateFormat,
    timezone: row.timezone,
    staleDays: row.staleDays,
  };
});
