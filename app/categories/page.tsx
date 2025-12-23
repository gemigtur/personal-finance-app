"use client";

import { CategoryManager } from "@/components/category-manager";
import { UnmappedReferences } from "@/components/unmapped-references";
import { Card, CardBody, CardHeader } from "@heroui/card";

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-8xl px-4 md:px-6 py-6 space-y-6 grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <h1 className="text-xl md:text-2xl font-bold">Categories</h1>
        </CardHeader>
        <CardBody>
          <CategoryManager />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg md:text-xl font-semibold">Unmapped References</h2>
        </CardHeader>
        <CardBody>
          <UnmappedReferences />
        </CardBody>
      </Card>
    </main>
  );
}
