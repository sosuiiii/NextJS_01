import { db } from "@vercel/postgres";
import { createClient } from '@supabase/supabase-js'

// const client = await db.connect();
const supabase = createClient("https://mbprbozgstetrjbosjng.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHJib3pnc3RldHJqYm9zam5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MzE3MjIsImV4cCI6MjA1MTEwNzcyMn0.RhdMD74wlCozqvBwWGhH52ad9a8OYTwZqFLARPhUVq4")


async function listInvoices() {
  // const { data, error } = await supabase
  //     .from('invoices')
  //     .select('amount, customers(name)')
  //     .eq('amount', 666);

  //   if (error) {
  //     console.error('🥕 tableの取得に失敗  Error fetching data:', error)
  //   } else {
  //     console.log("✅ tableの取得に成功！", data)
  //   }
  //   return data

  const { data, error } = await supabase.rpc('invoices')
  //   sql: `
  //     SELECT invoices.amount, customers🥸.name
  //     FROM invoices
  //     JOIN customers ON invoices.customer_id = customers.id
  //     WHERE invoices.amount = 666;
  //   `
  // });
  
  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Fetched data:', data);
  }
  return data;
  return [];
}

export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
  	return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}
