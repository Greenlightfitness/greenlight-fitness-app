// Script to create admin user directly via Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lfpcyhrccefbeowsgojv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.099PgzM5nxL0dot6dCX1VsUepqaJ7Y_pPgv0GvH9DBc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  const email = 'admin@mail.com';
  const password = '123456';

  console.log('🚀 Creating admin user...');
  
  try {
    // Step 1: Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists, trying to update role...');
      } else {
        throw signUpError;
      }
    } else {
      console.log('✅ User created:', signUpData.user?.id);
    }

    // Step 2: Get the user ID from sign in
    const { data: signInCheck } = await supabase.auth.signInWithPassword({ email, password });
    const userId = signInCheck?.user?.id;
    
    if (!userId) {
      console.log('❌ Could not get user ID');
      return;
    }

    // Step 3: Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'ADMIN', active_role: 'ADMIN', onboarding_completed: true })
        .eq('id', userId)
        .select();
      
      if (updateError) {
        console.log('⚠️  Update error:', updateError.message);
      } else {
        console.log('✅ Profile role updated to ADMIN:', updateData);
      }
    } else {
      // Create new profile with admin role
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          role: 'ADMIN',
          display_name: 'Admin',
          onboarding_completed: true
        })
        .select();
      
      if (insertError) {
        console.log('⚠️  Insert error:', insertError.message);
      } else {
        console.log('✅ Admin profile created:', insertData);
      }
    }

    // Step 3: Try to sign in to verify
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.log('⚠️  Sign-in test failed:', signInError.message);
      if (signInError.message.includes('Email not confirmed')) {
        console.log('');
        console.log('📧 Email confirmation required!');
        console.log('   Go to Supabase Dashboard > Authentication > Users');
        console.log('   Find admin@mail.com and click "Confirm Email"');
      }
    } else {
      console.log('✅ Sign-in successful! User ID:', signInData.user?.id);
    }

    console.log('');
    console.log('🎉 Done! Admin credentials:');
    console.log('   Email: admin@mail.com');
    console.log('   Password: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminUser();
