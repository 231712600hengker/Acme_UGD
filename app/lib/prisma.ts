import { PrismaClient } from "@/generated/prisma";
import { LatestInvoice } from "./definitions";
import { formatCurrency } from "./utils";

const prisma = new PrismaClient();

export async function fetchRevenuePrisma() {
  try {
    const data = await prisma.revenue.findMany();
    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoicesPrisma(
    take: number = 10,
    orderBy: "asc" | "desc" = "desc"
  ) {
    try {
      const data = await prisma.invoices.findMany({
        take,
        orderBy: {
          amount: orderBy,
        },
        include: {
          customer: {
            select: {
              name: true,
              image_url: true,
              email: true,
            },
          },
        },
      });
  
      const latestInvoices = data.map((invoice) => ({
        amount: formatCurrency(invoice.amount),
        name: invoice.customer.name,
        image_url: invoice.customer.image_url,
        email: invoice.customer.email,
        id: invoice.id,
      })) as unknown as LatestInvoice[];
  
      return latestInvoices;
    } catch (error) {
      console.error("Database Error:", error);
      throw new Error("Failed to fetch the latest invoices.");
    }
  }

export async function fetchCardDataPrisma() {
  try {
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      prisma.invoices.count(),
      prisma.customers.count(),
      prisma.invoices.groupBy({
        by: ["status"],
        _sum: {
          amount: true,
        },
      }),
    ]);

    const statusSummary = invoiceStatus.reduce((acc, curr) => {
      acc[curr.status] = formatCurrency(curr._sum.amount || 0);
      return acc;
    }, {} as Record<string, string>);

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      statusSummary,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}