import prisma from "@/lib/db";
import { z } from "zod";

export const productServiceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional().nullable(),
  hsnSac: z.string().optional().nullable(),
  unit: z.string().default("Nos"),
  defaultRate: z.number().min(0, "Rate cannot be negative").default(0),
  defaultGstRate: z.number().min(0).max(28).default(18),
  isActive: z.boolean().default(true),
});

export type ProductServiceFormData = z.infer<typeof productServiceSchema>;

export async function getProductsServices(category?: string, search?: string) {
  const where: any = { isActive: true };

  if (category && category !== "ALL") {
    where.category = category;
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { hsnSac: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.productService.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createProductService(data: ProductServiceFormData) {
  const validated = productServiceSchema.parse(data);
  return prisma.productService.create({
    data: {
      name: validated.name,
      category: validated.category.toUpperCase(),
      description: validated.description || null,
      hsnSac: validated.hsnSac || null,
      unit: validated.unit || "Nos",
      defaultRate: validated.defaultRate,
      defaultGstRate: validated.defaultGstRate,
      isActive: validated.isActive,
    },
  });
}

export async function updateProductService(id: string, data: ProductServiceFormData) {
  const validated = productServiceSchema.parse(data);
  return prisma.productService.update({
    where: { id },
    data: {
      name: validated.name,
      category: validated.category.toUpperCase(),
      description: validated.description || null,
      hsnSac: validated.hsnSac || null,
      unit: validated.unit || "Nos",
      defaultRate: validated.defaultRate,
      defaultGstRate: validated.defaultGstRate,
      isActive: validated.isActive,
    },
  });
}

export async function deleteProductService(id: string) {
  return prisma.productService.update({
    where: { id },
    data: { isActive: false },
  });
}

