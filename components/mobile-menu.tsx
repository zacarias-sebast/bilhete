"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface MobileMenuProps {
  items?: Array<{ href: string; label: string }>;
}

export function MobileMenu({ items = [] }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <nav className="flex flex-col gap-4 mt-8">
          {items.map((item) => (
            <SheetClose key={item.href} asChild>
              <Link
                href={item.href}
                className="px-4 py-2 rounded-md hover:bg-white/10 transition-colors text-foreground"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
