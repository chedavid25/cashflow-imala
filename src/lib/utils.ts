import * as React from "react"
import { slot } from "@/lib/utils" // Wait, I don't have lib/utils yet. 
// I'll just use raw tailwind for now or create lib/utils.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
