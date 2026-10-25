-- 02-storage-foto.sql
-- Jalankan SEKALI di Supabase: Dashboard > SQL Editor > New query > Run.
-- Membuat bucket Storage "produk-foto" untuk foto barang dari halaman tambah-produk.html.
-- Tanpa ini, barang tetap tersimpan, tapi fotonya pakai gambar bawaan.

insert into storage.buckets (id, name, public)
values ('produk-foto', 'produk-foto', true)
on conflict (id) do nothing;

-- Siapa saja boleh MELIHAT foto (katalog publik)
drop policy if exists "produk-foto: baca publik" on storage.objects;
create policy "produk-foto: baca publik"
  on storage.objects for select
  using (bucket_id = 'produk-foto');

-- User yang login hanya boleh UPLOAD ke folder miliknya sendiri: <user_id>/namafile.jpg
drop policy if exists "produk-foto: upload milik sendiri" on storage.objects;
create policy "produk-foto: upload milik sendiri"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'produk-foto'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- User hanya boleh HAPUS foto miliknya sendiri
drop policy if exists "produk-foto: hapus milik sendiri" on storage.objects;
create policy "produk-foto: hapus milik sendiri"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'produk-foto'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
