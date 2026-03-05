export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-visory-light to-pink-100 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
