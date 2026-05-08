import { supabase } from "@/integrations/supabase/client";

export type BankInfo = {
  bank_name: string;
  account_name: string;
  account_number: string;
};

export const DEFAULT_BANK: BankInfo = {
  bank_name: "Zenith Bank",
  account_name: "Rotary Club of Choba-Uniport",
  account_number: "0000000000",
};

export async function fetchBankInfo(): Promise<BankInfo> {
  const { data } = await supabase.from("app_settings").select("key,value");
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    bank_name: map.bank_name || DEFAULT_BANK.bank_name,
    account_name: map.account_name || DEFAULT_BANK.account_name,
    account_number: map.account_number || DEFAULT_BANK.account_number,
  };
}

export async function saveBankInfo(info: BankInfo) {
  const rows = [
    { key: "bank_name", value: info.bank_name },
    { key: "account_name", value: info.account_name },
    { key: "account_number", value: info.account_number },
  ];
  return supabase.from("app_settings").upsert(rows, { onConflict: "key" });
}
