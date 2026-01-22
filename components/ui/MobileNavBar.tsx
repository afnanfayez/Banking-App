'use client'

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { sidebarLinks } from "@/constants";
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const MobileNavBar = ({ user }: MobileNavProps) => {
    const pathname = usePathname();

    return (
        <section className="flex w-full max-w-[264px] justify-end">
            <Sheet>
                <SheetTrigger>
                    <Image src="/icons/hamburger.svg" width={30} height={30} alt="menu" className="cursor-pointer" />
                </SheetTrigger>
                <SheetContent side="left" className="border-none bg-white px-4 py-6">
                    <div className="sr-only">
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Access your account sections</SheetDescription>
                    </div>

                    <nav className="flex flex-col gap-8">
                        <Link href="/" className="cursor-pointer flex items-center gap-2 px-2 text-black-1">
                            <Image src="/icons/logo.svg" width={34} height={34} alt="Logo" />
                            <h1 className="text-26 font-ibm-plex-serif font-bold">Horizon</h1>
                        </Link>

                        <div className="flex flex-col gap-2">
                            {sidebarLinks.map((item) => {
                                const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

                                return (
                                    <SheetClose asChild key={item.route}>
                                        <Link
                                            href={item.route}
                                            className={cn('sidebar-link w-full px-4 py-3 rounded-lg', { 'bg-bank-gradient shadow-sm': isActive })}
                                        >
                                            <Image
                                                src={item.imgURL}
                                                alt={item.label}
                                                width={20}
                                                height={20}
                                                className={cn({ 'brightness-[3] invert-0': isActive })}
                                            />
                                            <p className={cn('text-16 font-semibold text-black-2', { '!text-white': isActive })}>
                                                {item.label}
                                            </p>
                                        </Link>
                                    </SheetClose>
                                );
                            })}
                        </div>
                    </nav>
                </SheetContent>
            </Sheet>
        </section>
    );
};

export default MobileNavBar;
