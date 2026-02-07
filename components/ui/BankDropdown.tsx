
"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { formUrlQuery, formatAmount } from "@/lib/utils";

export const BankDropdown = ({
  accounts = [],
  setValue,
  otherStyles,
  onChange,
  value,
}: BankDropdownProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Determine the currently selected account based on form value or fallback to the first account
  const currentAccount = accounts.find((a) => a.appwriteItemId === value) || accounts[0];

  useEffect(() => {
    // If we have accounts but no value is set in the form, initialize it
    if (accounts.length > 0 && !value) {
      const initialId = accounts[0].appwriteItemId;
      if (onChange) onChange(initialId);
      if (setValue) setValue("senderBank", initialId);
    }
  }, [accounts, value, onChange, setValue]);

  const handleBankChange = (id: string) => {

    // Update the form state
    if (onChange) onChange(id);
    if (setValue) setValue("senderBank", id);

    // Update URL for parent components (if needed)
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: id,
    });
    router.push(newUrl, { scroll: false });
  };

  if (accounts.length === 0) {
    return <p className="text-12 text-gray-500 px-3 py-2">No bank accounts found.</p>;
  }

  return (
    <Select
      value={value || accounts[0]?.appwriteItemId}
      onValueChange={handleBankChange}
    >
      <SelectTrigger
        className={`flex w-full bg-white gap-3 md:w-[300px] ${otherStyles}`}
      >
        <Image
          src="/icons/credit-card.svg"
          width={20}
          height={20}
          alt="account"
        />
        <p className="line-clamp-1 w-full text-left">{currentAccount?.name}</p>
      </SelectTrigger>
      <SelectContent
        className={`w-full bg-white md:w-[300px] ${otherStyles}`}
        align="end"
      >
        <SelectGroup>
          <SelectLabel className="py-2 font-normal text-gray-500">
            Select a bank to display
          </SelectLabel>
          {accounts.map((account: Account) => (
            <SelectItem
              key={account.appwriteItemId}
              value={account.appwriteItemId}
              className="cursor-pointer border-t"
            >
              <div className="flex flex-col ">
                <p className="text-16 font-medium">{account.name}</p>
                <p className="text-14 font-medium text-blue-600">
                  {formatAmount(account.currentBalance)}
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
