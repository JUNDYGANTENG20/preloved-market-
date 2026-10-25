-- 03-perbaiki-daftar.sql
-- Memperbaiki error "Database error saving new user" saat daftar akun.
-- Jalankan di Supabase: SQL Editor > New query > Run.
--
-- Penyebab: trigger on_auth_user_created (dari schema.sql) gagal membuat profil
-- di public.users, sehingga pendaftaran ikut dibatalkan.
-- Perbaikan: kalau pembuatan profil gagal, akun TETAP dibuat dan
-- penyebabnya dicatat sebagai WARNING di Logs > Postgres.

-- 1) Pastikan index unik untuk "on conflict (auth_user_id)" ada
create unique index if not exists users_auth_user_id_uidx
  on public.users (auth_user_id);

-- 2) Trigger yang tidak menggagalkan pendaftaran
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nama_profil text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'nama'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );
  profile_id_type text;
begin
  begin
    select data_type into profile_id_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'id';

    if profile_id_type = 'uuid' then
      insert into public.users (id, auth_user_id, username, email)
      values (new.id, new.id, nama_profil, coalesce(new.email, ''))
      on conflict (auth_user_id) do update
        set username = excluded.username, email = excluded.email;
    else
      insert into public.users (auth_user_id, username, email)
      values (new.id, nama_profil, coalesce(new.email, ''))
      on conflict (auth_user_id) do update
        set username = excluded.username, email = excluded.email;
    end if;
  exception when others then
    raise warning 'Profil public.users gagal dibuat untuk %: % (%)',
      new.email, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 3) (Opsional) Cek struktur tabel users. Kolom dengan is_nullable = NO
--    dan column_default kosong selain id/auth_user_id/username/email
--    adalah penyebab profil gagal dibuat.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'users'
order by ordinal_position;
