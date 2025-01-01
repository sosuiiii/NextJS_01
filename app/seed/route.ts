import bcrypt from 'bcrypt';
// import { db } from '@vercel/postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto';

const supabase = createClient("https://mbprbozgstetrjbosjng.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHJib3pnc3RldHJqYm9zam5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MzE3MjIsImV4cCI6MjA1MTEwNzcyMn0.RhdMD74wlCozqvBwWGhH52ad9a8OYTwZqFLARPhUVq4", { db: { schema: 'public' }})

async function seedUsers() {
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const currentDate: Date = new Date();
        const { error } = await supabase
          .from('users')
          .insert({
            user_id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
          })
          .select();

        if (error) {
          console.error(`🥕 Error: seedUsers _ ${user.name}:`, error);
        } else {
          console.log("✅ Success: seedUsers")
        }
        return user;
      })
    );
    return insertedUsers;
}

async function seedInvoices() {
  try {
    const insertedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const { error } = await supabase
          .from('invoices')
          .insert({
            customer_id: invoice.customer_id,
            amount: invoice.amount,
            status: invoice.status,
            date: invoice.date,
          })
          .select();

        if (error) {
          console.error(`Error inserting invoice with customer_id ${invoice.customer_id}:`, error);
        }
        return invoice;
      })
    );
    console.log('✅ Invoices inserted successfully:', insertedInvoices);
    return insertedInvoices;
  } catch (error) {
    console.error('🥕 Unexpected error inserting invoices:', error);
  }
  return [];
}

async function seedCustomers() {
    try {
      const insertedCustomers = await Promise.all(
        customers.map(async (customer) => {
          const { error } = await supabase
            .from('customers')
            .insert({
              customer_id: customer.id,
              name: customer.name,
              email: customer.email,
              image_url: customer.image_url,
            })
            .select();

          if (error) {
            console.error(`Error inserting customer ${customer}:`, error);
          }
          return customer;
        })
      );
      console.log('✅ customers inserted successfully:', customers);
      return customers;
    } catch (error) {
      console.error('🥕 Unexpected error inserting invoices:', error);
    }
    return [];
}

async function seedRevenue() {
  try {
    const insertedRevenue = await Promise.all(
      revenue.map(async (rev) => {
        const { error } = await supabase
          .from('revenue')
          .insert({
            month: rev.month, // string
            revenue: rev.revenue, // number
          })
          .select();

        if (error) {
          console.error(`Error inserting invoice with customer_id ${rev}:`, error);
        }
        return rev;
      })
    );
    console.log('✅ revenue inserted successfully:', insertedRevenue);
    return insertedRevenue;
  } catch (error) {
    console.error('🥕 Unexpected error inserting revenue:', error);
  }
  return [];
}

export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
  //   await supabase.rpc('execute_sql', {
  //     sql: 'BEGIN'
  // });
    await seedUsers();
    // await seedCustomers();
    // await seedInvoices();
    await seedRevenue();
  //   await supabase.rpc('execute_sql', {
  //     sql: 'COMMIT'
  // });

    return Response.json({ message: '✅ Database seeded successfully' });
  } catch (error) {
    // await supabase.rpc('execute_sql', {
    //   sql: 'ROLLBACK'
  // });
    return Response.json({ error }, { status: 500 });
  }
}
