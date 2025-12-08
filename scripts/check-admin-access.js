/**
 * Admin Access Diagnostic Script
 * Checks if a user email has admin access and helps troubleshoot issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\n💡 Make sure you have a .env.local file with these variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Admin emails from the codebase (should match src/utils/admin.js)
const ADMIN_EMAILS = [
  'raymondvdw@gmail.com',
  'elanridp@gmail.com',
].map(email => email.toLowerCase());

async function checkAdminAccess(email) {
  console.log('\n🔍 Checking admin access for:', email);
  console.log('=' .repeat(60));

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  console.log('📧 Normalized email:', normalizedEmail);

  // Check if email is in admin allowlist
  const isInAllowlist = ADMIN_EMAILS.includes(normalizedEmail);
  console.log('✅ In admin allowlist:', isInAllowlist ? 'YES' : 'NO');
  if (!isInAllowlist) {
    console.log('   Current admin emails:', ADMIN_EMAILS);
  }

  // Check if user exists in Supabase
  try {
    console.log('\n🔎 Searching for user in Supabase...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    // Find user by email (case-insensitive)
    const user = users?.users?.find(
      u => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      console.log('❌ User not found in Supabase');
      console.log('\n💡 Possible issues:');
      console.log('   1. User has not signed up yet');
      console.log('   2. Email is different in Supabase');
      console.log('   3. User signed up with a different email');
      
      // Show similar emails
      if (users?.users?.length > 0) {
        console.log('\n📋 Similar emails found in Supabase:');
        const similarEmails = users.users
          .filter(u => u.email?.toLowerCase().includes('elan') || u.email?.toLowerCase().includes('ridp'))
          .map(u => `   - ${u.email} (ID: ${u.id})`);
        if (similarEmails.length > 0) {
          similarEmails.forEach(e => console.log(e));
        } else {
          console.log('   (No similar emails found)');
        }
      }
      return;
    }

    console.log('✅ User found in Supabase!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Email confirmed:', user.email_confirmed_at ? 'YES ✅' : 'NO ❌');
    console.log('   Created at:', user.created_at);
    console.log('   Last sign in:', user.last_sign_in_at || 'Never');

    // Check admin status
    const userEmailLower = user.email?.toLowerCase();
    const hasAdminAccess = ADMIN_EMAILS.includes(userEmailLower);

    console.log('\n🎯 Admin Access Summary:');
    console.log('   Email in allowlist:', hasAdminAccess ? 'YES ✅' : 'NO ❌');
    
    if (!hasAdminAccess) {
      console.log('\n⚠️  ISSUE FOUND: User exists but email is not in admin allowlist!');
      console.log('   User email in Supabase:', userEmailLower);
      console.log('   Admin allowlist:', ADMIN_EMAILS);
      
      // Check for case sensitivity issues
      const exactMatch = ADMIN_EMAILS.find(adminEmail => 
        adminEmail === userEmailLower
      );
      if (!exactMatch) {
        console.log('\n💡 SOLUTION:');
        console.log('   The email in Supabase might be slightly different.');
        console.log('   Please verify the exact email address in Supabase dashboard.');
        console.log('   Or add this email to the admin allowlist in src/utils/admin.js');
      }
    } else {
      console.log('\n✅ User should have admin access!');
      console.log('\n💡 If they still can\'t access admin dashboard:');
      console.log('   1. Make sure they are logged in with this exact email');
      console.log('   2. Clear browser cache and localStorage');
      console.log('   3. Try logging out and back in');
      console.log('   4. Check browser console for errors');
    }

  } catch (error) {
    console.error('❌ Error checking user:', error.message);
  }
}

// Main execution
const emailToCheck = process.argv[2] || 'elanridp@gmail.com';

console.log('🔐 Admin Access Diagnostic Tool');
console.log('=' .repeat(60));
console.log('Checking email:', emailToCheck);

checkAdminAccess(emailToCheck)
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

