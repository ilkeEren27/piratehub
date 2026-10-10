"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const SearchUsers = () => {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const queryTerm = formData.get("search") || "";
          // Add query to the end of the path while making a search
          router.push(pathname + "?search=" + encodeURIComponent(queryTerm));
        }}
      >
        <Label htmlFor="search" className="font-bold text-2xl justify-center">
          {t("searchUsers")}
        </Label>
        <div className="flex my-4 gap-2">
          <Input id="search" name="search" type="text" className="w-60" />
          <Button type="submit">{t("search")}</Button>
        </div>
      </form>
    </div>
  );
};
