import { Transaction } from "@/lib/services/transaction-service";
import { format } from "date-fns";

export function exportTransactionsToCSV(transactions: Transaction[], filename: string = "movimientos_cashflow.csv") {
  if (transactions.length === 0) return;

  const headers = [
    "Fecha",
    "Tipo",
    "Categoría",
    "Monto",
    "Moneda",
    "Estado",
    "Pagado Por",
    "ID Cuenta"
  ];

  const rows = transactions.map(t => [
    format(t.date.toDate(), "yyyy-MM-dd HH:mm"),
    t.type === 'income' ? 'Ingreso' : t.type === 'expense' ? 'Gasto' : 'Otro',
    t.category,
    t.amount,
    t.currency,
    t.status === 'completed' ? 'Completado' : 'Pendiente',
    t.paidBy,
    t.accountId
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
