// src/components/layout/MegaMenuClient.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MegaMenuClient({ groups }: { groups: any[] }) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <nav
      className="relative flex items-center gap-8 xl:gap-10 h-16"
      aria-label="Main navigation"
      onMouseLeave={() => setActiveGroup(null)}
    >
      {groups.map((group) => {
        const isLink = group.type === "link";
        const isActive = activeGroup === group.id;

        return (
          <div
            key={group.id}
            className="relative h-full flex items-center"
            onMouseEnter={() => !isLink && setActiveGroup(group.id)}
          >
            {/* DIRECT LINK */}
            {isLink ? (
              <Link
                href={group.navLink || "#"}
                className="
                  relative
                  inline-flex items-center
                  text-[13px] font-semibold uppercase tracking-[0.14em]
                  text-zinc-800
                  transition-all duration-300
                  hover:text-[#217A6E]
                  after:absolute after:left-0 after:-bottom-[22px]
                  after:h-[2px] after:w-0
                  after:bg-[#217A6E]
                  after:transition-all after:duration-300
                  hover:after:w-full
                "
              >
                {group.title}
              </Link>
            ) : (
              <button
                type="button"
                aria-expanded={isActive}
                aria-haspopup="true"
                className={`
                  relative inline-flex items-center gap-1.5
                  text-[13px] font-semibold uppercase tracking-[0.14em]
                  transition-all duration-300
                  ${
                    isActive
                      ? "text-[#217A6E]"
                      : "text-zinc-800 hover:text-[#217A6E]"
                  }
                `}
              >
                <span>{group.title}</span>

                <ChevronDown
                  className={`
                    w-4 h-4 transition-transform duration-300
                    ${isActive ? "rotate-180" : ""}
                  `}
                />

                {/* ACTIVE BAR */}
                <span
                  className={`
                    absolute left-0 -bottom-[22px]
                    h-[2px] bg-[#217A6E]
                    transition-all duration-300
                    ${isActive ? "w-full opacity-100" : "w-0 opacity-0"}
                  `}
                />
              </button>
            )}

            {/* MEGA PANEL */}
            <AnimatePresence>
              {isActive && !isLink && (
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="
                    absolute left-1/2 top-full z-50
                    -translate-x-1/2
                    pt-6
                  "
                >
                  <div
                    className="
    w-[min(1280px,95vw)]
    overflow-hidden
    rounded-[28px]
    border border-zinc-200/70

    bg-gradient-to-br
    from-white
    via-[#f8fcfb]
    to-[#eef7f5]

    backdrop-blur-xl
    shadow-[0_30px_80px_rgba(0,0,0,0.12)]
  "
                  >
                    <div className="grid grid-cols-12">
                      {/* MENU COLUMNS */}
                      {/* MENU COLUMNS */}
                      <div className="relative col-span-8 px-10 py-10 bg-gradient-to-br from-white via-[#f9fcfb] to-[#f1f8f6]">
                        {/* SOFT DIVIDER */}
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-zinc-200/50 to-transparent " />

                        <div className="grid grid-cols-3 gap-10">
                          {group.columns?.map((column: any) => (
                            <div key={column.id}>
                              <h3
                                className="
                                  mb-5
                                  text-[11px]
                                  font-bold
                                  uppercase
                                  tracking-[0.22em]
                                  text-[#217A6E]
                                "
                              >
                                {column.title || "Explore"}
                              </h3>

                              <ul className="space-y-1.5">
                                {column.items?.map((item: any) => (
                                  <li key={item.id}>
                                    <Link
                                      href={
                                        item.type === "COLLECTION"
                                          ? `/collections/${item.slug}`
                                          : item.type === "PRODUCT"
                                            ? `/product/${item.slug}`
                                            : `/${item.slug}`
                                      }
                                      className="
                                        group
                                        flex items-center justify-between
                                        rounded-xl
                                        px-3 py-2.5

                                        text-sm font-medium text-zinc-700

                                        transition-all duration-250

                                        hover:bg-white
                                        hover:text-[#217A6E]
                                        hover:shadow-sm
                                      "
                                    >
                                      <div className="flex items-center">
                                        <span
                                          className="
                                            mr-0
                                            h-[2px] w-0
                                            rounded-full
                                            bg-[#217A6E]

                                            transition-all duration-250

                                            group-hover:mr-3
                                            group-hover:w-4
                                          "
                                        />

                                        <span>{item.label}</span>
                                      </div>

                                      <ArrowRight
                                        className="
                                          h-4 w-4
                                          opacity-0
                                          -translate-x-1

                                          transition-all duration-250

                                          group-hover:translate-x-0
                                          group-hover:opacity-100
                                        "
                                      />
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PROMO BLOCK */}
                      {group.image && (
                        <div className="col-span-4 bg-zinc-50/70 p-6">
                          <div
                            className="
                              group
                              relative
                              h-full min-h-[320px]
                              overflow-hidden
                              rounded-[24px]
                            "
                          >
                            <Image
                              src={group.image}
                              alt={group.title}
                              fill
                              className="
                                object-cover
                                transition-transform duration-700
                                group-hover:scale-105
                              "
                            />

                            {/* CONTENT */}
                            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                              <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                                Featured
                              </p>

                              <h3 className="mt-2 text-2xl font-semibold leading-tight">
                                {group.title}
                              </h3>

                              <div
                                className="
                                  mt-4 inline-flex items-center gap-2
                                  text-sm font-medium
                                  text-white/90
                                  transition-all duration-300
                                  group-hover:gap-3
                                "
                              >
                                Explore Collection
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
