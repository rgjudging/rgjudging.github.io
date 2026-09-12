# Production setup

The platform runs in demo mode when Supabase environment variables are absent. To enable the connected production workspace:

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Create authenticated users in Supabase Authentication.
4. Insert a matching row in `public.profiles` for each user and assign `admin`, `judge`, `secretariat`, or `public`.
5. Copy `.env.example` to `.env.local` and set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Start the app with `npm run dev`.
7. Open `platform.html` and pass a competition id with `?competition=UUID` after signing in.

The anonymous public role can read only competitions marked `published` and their associated participants. Judges can read and write only their assigned score panels. Secretariat users can manage routines and participants. Admin users can manage competitions.

The current judge screen remains available at `index.html` as the demonstration judging interface. The next production integration step is to persist its DB, DA, artistry and execution payloads into `public.scores` for the selected routine.
