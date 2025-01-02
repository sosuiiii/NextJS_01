import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  LatestInvoice,
} from './definitions';
import { formatCurrency } from './utils';
import { createClient } from '@supabase/supabase-js'
import { off } from 'process';

const supabase = createClient("https://mbprbozgstetrjbosjng.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHJib3pnc3RldHJqYm9zam5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MzE3MjIsImV4cCI6MjA1MTEwNzcyMn0.RhdMD74wlCozqvBwWGhH52ad9a8OYTwZqFLARPhUVq4")

export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select("month, revenue")
      // .eq('amount', 666);

    if (error) {
      console.error('🥕 revenueの取得に失敗  Error fetching data:', error)
    } else {
      console.log("✅ revenueの取得に成功！", data)
    }
    return data ?? [];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices(): Promise<LatestInvoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        amount,
        id,
        customers (
          name,
          image_url,
          email
        )
      `)
      .order('date', { ascending: false })
      .limit(5)
      .returns<LatestInvoice[]>()

      console.log("✅ インボイス：", data)
    if (error) {
      console.error('❌インボイス取得失敗', error);
      throw new Error('Failed to fetch the latest invoices.');
    }
    const latestInvoices: LatestInvoice[] = data?.map((invoice) => ({
      id: invoice.id,
      name: invoice.customers.name,
      image_url: invoice.customers.image_url,
      email: invoice.customers.email,
      amount: formatCurrency(invoice.amount),
    }));

    // const result = latestInvoices ?? []
    console.log("🥕おお！", data);
    return latestInvoices;
  } catch (error) {
    console.error('Unexpected Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    // const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const invoiceCountPromise = supabase
      .from('invoices')
      .select()
    // const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const customerCountPromise = supabase
      .from('customers')
      .select()
    // const invoiceStatusPromise = sql`SELECT
    //      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
    //      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
    //      FROM invoices`;
    // const invoiceStatusPromise = supabase
    //   .from('invoices')
    //   .select();
    const invoiceStatusPromise = await supabase.rpc('invoices_amount')

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].data.length ?? '0');
    const numberOfCustomers = Number(data[1].data.length ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].data[0].paid ?? '0');

    const totalPendingInvoices = formatCurrency(data[2].data[0].pending ?? '0');
    // let totalPaidInvoices = 0;
    // let totalPendingInvoices = 0;
    // data[2].data?.forEach(data => {
    //   if (data.status === "paid") {
    //     totalPaidInvoices += data.amount
    //   } else if (data.status === "pending") {
    //     totalPendingInvoices += data.amount
    //   }
    // })
    console.log('✅:invoiceCountPromise:', data[0]);
    console.log('✅:customerCountPromise:', data[1]);
    console.log('✅:invoiceStatusPromise:', data[2]);
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('🥕:fetchCardDataエラー:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const {data, error} = await supabase.rpc('invoices_filtered', {
      query: query,
      items_per_page: ITEMS_PER_PAGE,
      offset_index: offset,
    })

    // const invoices = await sql<InvoicesTable>`
    //   SELECT
    //     invoices.id,
    //     invoices.amount,
    //     invoices.date,
    //     invoices.status,
    //     customers.name,
    //     customers.email,
    //     customers.image_url
    //   FROM invoices
    //   JOIN customers ON invoices.customer_id = customers.id
    //   WHERE
    //     customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`} OR
    //     invoices.amount::text ILIKE ${`%${query}%`} OR
    //     invoices.date::text ILIKE ${`%${query}%`} OR
    //     invoices.status ILIKE ${`%${query}%`}
    //   ORDER BY invoices.date DESC
    //   LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    // `;
    if (error) {
      console.error("🥕 invoice", error)
    } else {
      console.log("✅ invoice", data)
    }

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
