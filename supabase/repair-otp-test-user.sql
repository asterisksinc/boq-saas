-- DEV / TEST ONLY.
-- Removes the malformed seeded Auth account so the passwordless login endpoint
-- can recreate it through GoTrue with all required internal Auth fields.
-- Public user/profile/membership/onboarding rows referencing this Auth user are
-- removed by their existing foreign-key cascade rules.

begin;

delete from auth.users
where lower(email) = 'diptishgohane04@gmail.com';

commit;
