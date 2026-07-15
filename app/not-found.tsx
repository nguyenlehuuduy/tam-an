import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center bg-base-gradient">
      <p className="mb-2 text-6xl">✦</p>
      <h1 className="font-display text-2xl font-bold text-base-text-primary mb-3">
        Không tìm thấy trang
      </h1>
      <p className="text-sm text-base-text-secondary/60 mb-6">
        Có lẽ ngôi sao này đã trôi đi nơi khác rồi...
      </p>
      <Link
        href="/"
        className="rounded-full bg-white/8 px-6 py-3 text-sm font-semibold text-base-text-primary hover:bg-white/12 transition-colors"
      >
        ← Quay về trang chủ
      </Link>
    </div>
  );
}
